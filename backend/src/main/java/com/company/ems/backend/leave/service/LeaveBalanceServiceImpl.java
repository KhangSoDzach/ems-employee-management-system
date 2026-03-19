package com.company.ems.backend.leave.service;

import com.company.ems.backend.leave.dto.LeaveBalanceResponse;
import com.company.ems.backend.leave.entity.Leave;
import com.company.ems.backend.leave.entity.LeaveBalance;
import com.company.ems.backend.leave.enums.LeaveType;
import com.company.ems.backend.leave.mapper.LeaveMapper;
import com.company.ems.backend.leave.repository.LeaveBalanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

        private final LeaveBalanceRepository leaveBalanceRepository;
        private final LeaveMapper leaveMapper;

        @Override
        @Transactional(readOnly = true)
        public List<LeaveBalanceResponse> getBalanceForEmployee(Long employeeId) {
                int currentYear = LocalDate.now().getYear();
                return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, currentYear)
                                .stream()
                                .map(leaveMapper::toResponse)
                                .toList();
        }

        @Override
        public void deductBalance(Long employeeId, LeaveType leaveType, int days) {
                int year = LocalDate.now().getYear();
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
                leaveBalanceRepository.save(balance);
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
                leaveBalanceRepository.save(balance);
                log.info("Returned {} days to leaveType={} balance for employeeId={}. Remaining: {}",
                                days, leaveType, employeeId, balance.getRemainingDays());
        }

        @Override
        @Transactional(readOnly = true)
        public boolean hasSufficientBalance(Long employeeId, LeaveType leaveType, int days) {
                int year = LocalDate.now().getYear();
                return leaveBalanceRepository
                                .findByEmployeeIdAndYearAndLeaveType(employeeId, year, leaveType)
                                .map(b -> b.hasSufficientBalance(days))
                                .orElse(true); // No quota record → treat as unlimited (e.g. UNPAID)
        }

        // ─── Mapping ──────────────────────────────────────────────────────────────
}
