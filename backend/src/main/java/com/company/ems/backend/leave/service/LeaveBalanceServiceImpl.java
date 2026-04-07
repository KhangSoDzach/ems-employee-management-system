package com.company.ems.backend.leave.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.entity.LeaveBalance;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.enums.LeaveStatus;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveBalanceRepository;
import com.company.ems.backend.leave.repository.LeaveRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Manages employee leave balance read, deduct, and return operations.
 *
 * <p>
 * The balance formula (per FR-LEAVE-003):
 * 
 * <pre>
 * remainingDays = (totalDays + carriedForwardDays) - usedDays
 * </pre>
 * 
 * This matches the domain logic already implemented in
 * {@link LeaveBalance#calculateRemainingDays()}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LeaveBalanceServiceImpl implements LeaveBalanceService {

        private static final int DEFAULT_ANNUAL_LEAVE_DAYS = 12;

        private final LeaveBalanceRepository leaveBalanceRepository;
        private final LeaveRepository leaveRepository;
        private final LeaveMapper leaveMapper;
        private final EmployeeRepository employeeRepository;

        private static final List<LeaveStatus> PENDING_STATUSES = List.of(
                        LeaveStatus.PENDING,
                        LeaveStatus.PENDING_LEVEL_1,
                        LeaveStatus.PENDING_LEVEL_2,
                        LeaveStatus.PENDING_LEVEL_3,
                        LeaveStatus.PENDING_LEVEL_4,
                        LeaveStatus.PENDING_LEVEL_5);

        @Override
        public List<LeaveBalanceResponse> getBalanceForEmployee(Long employeeId) {
                int currentYear = LocalDate.now().getYear();
                initializeDefaultBalancesForEmployee(employeeId, currentYear);
                return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, currentYear)
                                .stream()
                                .map(leaveMapper::toResponse)
                                .toList();
        }

        @Override
        public void initializeDefaultBalancesForEmployee(Long employeeId, int year) {
                boolean exists = leaveBalanceRepository
                                .findByEmployeeIdAndYearAndLeaveType(employeeId, year, LeaveType.ANNUAL)
                                .isPresent();
                if (exists) {
                        return;
                }

                LeaveBalance annual = LeaveBalance.builder()
                                .employee(employeeRepository.getReferenceById(employeeId))
                                .year(year)
                                .leaveType(LeaveType.ANNUAL)
                                .totalDays(DEFAULT_ANNUAL_LEAVE_DAYS)
                                .usedDays(0)
                                .carriedForwardDays(0)
                                .allowCarryForward(true)
                                .expiryDate(LocalDate.of(year, 12, 31))
                                .notes("Default annual leave quota")
                                .build();
                annual.calculateRemainingDays();
                LeaveBalance saved = leaveBalanceRepository.save(annual);
                syncEmployeeDenormalizedBalance(employeeId, LeaveType.ANNUAL,
                                saved.getRemainingDays());
                log.info("Initialized default ANNUAL leave balance for employeeId={} year={}",
                                employeeId, year);
        }

        @Override
        @Transactional(readOnly = true)
        public int getRemainingDays(Long employeeId, LeaveType leaveType) {
                int year = LocalDate.now().getYear();
                if (LeaveType.ANNUAL.equals(leaveType)) {
                        initializeDefaultBalancesForEmployee(employeeId, year);
                }
                return leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                                .map(LeaveBalance::getRemainingDays)
                                .orElse(LeaveType.ANNUAL.equals(leaveType) ? DEFAULT_ANNUAL_LEAVE_DAYS : 0);
        }

        @Override
        public void deductBalance(Long employeeId, LeaveType leaveType, int days) {
                int year = LocalDate.now().getYear();
                if (LeaveType.ANNUAL.equals(leaveType)) {
                        initializeDefaultBalancesForEmployee(employeeId, year);
                }
                Optional<LeaveBalance> opt = leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId,
                                year,
                                leaveType);

                if (opt.isEmpty()) {
                        // No balance record — leave type may not have a quota (e.g. UNPAID). Skip
                        // silently.
                        log.info("No leave balance record for employeeId={} leaveType={} year={} — skipping deduction.",
                                        employeeId, leaveType, year);
                        return;
                }

                LeaveBalance balance = opt.get();
                balance.useLeave(days);
                LeaveBalance saved = leaveBalanceRepository.save(balance);
                syncEmployeeDenormalizedBalance(employeeId, leaveType, saved.getRemainingDays());
                log.info("Deducted {} days from leaveType={} balance for employeeId={}. Remaining: {}",
                                days, leaveType, employeeId, balance.getRemainingDays());
        }

        @Override
        public void returnBalance(Long employeeId, LeaveType leaveType, int days) {
                int year = LocalDate.now().getYear();
                Optional<LeaveBalance> opt = leaveBalanceRepository.findByEmployeeIdAndYearAndLeaveType(employeeId,
                                year,
                                leaveType);

                if (opt.isEmpty()) {
                        log.info("No leave balance record for employeeId={} leaveType={} — nothing to return.",
                                        employeeId,
                                        leaveType);
                        return;
                }

                LeaveBalance balance = opt.get();
                balance.returnLeave(days);
                LeaveBalance saved = leaveBalanceRepository.save(balance);
                syncEmployeeDenormalizedBalance(employeeId, leaveType, saved.getRemainingDays());
                log.info("Returned {} days to leaveType={} balance for employeeId={}. Remaining: {}",
                                days, leaveType, employeeId, balance.getRemainingDays());
        }

        @Override
        @Transactional(readOnly = true)
        public boolean hasSufficientBalance(Long employeeId, LeaveType leaveType, int days) {
                int year = LocalDate.now().getYear();
                if (LeaveType.ANNUAL.equals(leaveType)) {
                        initializeDefaultBalancesForEmployee(employeeId, year);
                }

                // Per user request: Subtract pending requests from remaining balance to block
                // new ones
                int pendingDays = leaveRepository.sumPendingDays(employeeId, leaveType, PENDING_STATUSES, year);

                return leaveBalanceRepository
                                .findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                                .map(b -> (b.getRemainingDays() - pendingDays) >= days)
                                .orElse(true); // No quota record → treat as unlimited (e.g. UNPAID)
        }

        private void syncEmployeeDenormalizedBalance(Long employeeId, LeaveType leaveType, Integer remainingDays) {
                if (remainingDays == null) {
                        return;
                }

                employeeRepository.findById(employeeId).ifPresent(employee -> {
                        switch (leaveType) {
                                case ANNUAL -> employee.setAnnualLeaveBalance(remainingDays);
                                case SICK -> employee.setSickLeaveBalance(remainingDays);
                                default -> {
                                        return;
                                }
                        }
                        employeeRepository.save(employee);
                });
        }

        // ─── Mapping ──────────────────────────────────────────────────────────────
}
