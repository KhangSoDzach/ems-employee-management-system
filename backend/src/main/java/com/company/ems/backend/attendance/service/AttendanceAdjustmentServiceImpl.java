package com.company.ems.backend.attendance.service;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestCreateDto;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestSummaryResponse;
import com.company.ems.backend.attendance.dto.adjustment.ApprovalActionDto;
import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.attendance.entity.AttendanceAdjustmentHistory;
import com.company.ems.backend.attendance.entity.AttendanceAdjustmentRequest;
import com.company.ems.backend.attendance.enums.AdjustmentAction;
import com.company.ems.backend.attendance.enums.AdjustmentRequestStatus;
import com.company.ems.backend.attendance.mapper.AttendanceMapper;
import com.company.ems.backend.attendance.repository.AttendanceAdjustmentHistoryRepository;
import com.company.ems.backend.attendance.repository.AttendanceAdjustmentRequestRepository;
import com.company.ems.backend.attendance.repository.AttendanceRepository;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.event.NotificationEvent;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.service.NotificationService;
import com.company.ems.backend.common.service.PhotoStorageService;
import com.company.ems.backend.config.OfficeLocationProperties;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import com.company.ems.backend.workflow.entity.WorkflowLevel;
import com.company.ems.backend.workflow.entity.WorkflowTemplate;
import com.company.ems.backend.workflow.enums.WorkflowType;
import com.company.ems.backend.workflow.service.WorkflowEngineService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link AttendanceAdjustmentService}.
 *
 * <p>
 * <strong>State transition responsibilities:</strong>
 * <ol>
 * <li>Load the relevant domain objects and validate pre-conditions.
 * <li>Call the helper methods on {@link AttendanceAdjustmentRequest} to mutate
 * state.
 * <li>Persist an immutable {@link AttendanceAdjustmentHistory} record.
 * <li>If the request is APPROVED (last level), auto-apply the correction to the
 * {@link Attendance} entity and log APPLIED_TO_ATTENDANCE.
 * <li>Fire a {@link NotificationEvent} for affected parties.
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttendanceAdjustmentServiceImpl implements AttendanceAdjustmentService {

        private final AttendanceAdjustmentRequestRepository requestRepository;
        private final AttendanceMapper attendanceMapper;
        private final MessageService messages;
        private final AttendanceAdjustmentHistoryRepository historyRepository;
        private final AttendanceRepository attendanceRepository;
        private final EmployeeRepository employeeRepository;
        private final UserRepository userRepository;
        private final WorkflowEngineService workflowEngineService;
        private final NotificationService notificationService;
        private final PhotoStorageService photoStorageService;
        private final OfficeLocationProperties officeProps;

        // ─── Employee actions ─────────────────────────────────────────────────────

        @Override
        public AdjustmentRequestResponse submitRequest(AdjustmentRequestCreateDto dto,
                        CustomUserPrincipal principal) {
                validateAtLeastOneProposedTime(dto);

                Employee employee = resolveEmployee(principal);
                User actor = resolveUser(principal);

                // Load workflow template to know max levels
                WorkflowTemplate template = workflowEngineService.getActiveTemplate(
                                WorkflowType.MANUAL_ATTENDANCE_ADJUSTMENT);
                List<WorkflowLevel> levels = workflowEngineService.getLevels(template);
                int maxLevel = levels.size();
                if (maxLevel == 0)
                        maxLevel = 1; // safety fallback

                // Optionally look up an existing attendance record for that date
                Attendance existingAttendance = attendanceRepository
                                .findByEmployeeIdAndDate(employee.getId(), dto.getRequestDate())
                                .orElse(null);

                // Save incident photo if provided
                String incidentPhotoPath = null;
                if (dto.getIncidentPhotoBase64() != null && !dto.getIncidentPhotoBase64().isBlank()) {
                        incidentPhotoPath = photoStorageService.savePhoto(
                                        dto.getIncidentPhotoBase64(),
                                        employee.getEmployeeCode());
                }

                boolean requiresManualReview = dto.isReportsMissingGeoOrPhoto();

                AttendanceAdjustmentRequest request = AttendanceAdjustmentRequest.builder()
                                .employee(employee)
                                .attendance(existingAttendance)
                                .requestDate(dto.getRequestDate())
                                .proposedCheckInTime(dto.getProposedCheckInTime())
                                .proposedCheckOutTime(dto.getProposedCheckOutTime())
                                .reasonType(dto.getReasonType())
                                .reasonText(dto.getReasonText())
                                .status(AdjustmentRequestStatus.PENDING_LEVEL_1)
                                .currentApprovalLevel(1)
                                .maxApprovalLevel(maxLevel)
                                .workflowTemplateId(template.getId())
                                .incidentGeoLog(dto.getIncidentGeoLog())
                                .incidentPhotoUrl(incidentPhotoPath)
                                .requiresManualReview(requiresManualReview)
                                .build();

                AttendanceAdjustmentRequest saved = requestRepository.save(request);

                // Create history record
                historyRepository.save(AttendanceAdjustmentHistory.of(
                                saved, actor, AdjustmentAction.SUBMITTED,
                                null, null,
                                null, AdjustmentRequestStatus.PENDING_LEVEL_1));

                // Notify level-1 approvers
                notifyApprovers(saved, template, 1, messages.get(MessageCode.ADJUSTMENT_NOTIFY_NEW));

                log.info("Employee [{}] submitted adjustment request [{}] for date {}",
                                employee.getEmployeeCode(), saved.getId(), dto.getRequestDate());
                return toDetailWithHistory(saved, null);
        }

        @Override
        public AdjustmentRequestResponse resubmit(Long requestId,
                        AdjustmentRequestCreateDto dto,
                        CustomUserPrincipal principal) {
                validateAtLeastOneProposedTime(dto);

                AttendanceAdjustmentRequest request = loadAndAssertOwnership(requestId, principal);

                if (request.getStatus() != AdjustmentRequestStatus.RETURNED_TO_EMPLOYEE) {
                        throw new BusinessException("INVALID_REQUEST_STATE",
                                        messages.get(MessageCode.ADJUSTMENT_INVALID_STATE, request.getStatus()));
                }

                AdjustmentRequestStatus previousStatus = request.getStatus();

                // Update mutable fields
                request.setRequestDate(dto.getRequestDate());
                request.setProposedCheckInTime(dto.getProposedCheckInTime());
                request.setProposedCheckOutTime(dto.getProposedCheckOutTime());
                request.setReasonType(dto.getReasonType());
                request.setReasonText(dto.getReasonText());
                request.setIncidentGeoLog(dto.getIncidentGeoLog());
                request.setRequiresManualReview(dto.isReportsMissingGeoOrPhoto());

                if (dto.getIncidentPhotoBase64() != null && !dto.getIncidentPhotoBase64().isBlank()) {
                        String path = photoStorageService.savePhoto(
                                        dto.getIncidentPhotoBase64(),
                                        request.getEmployee().getEmployeeCode());
                        request.setIncidentPhotoUrl(path);
                }

                request.resubmit(); // resets status + level

                requestRepository.save(request);
                User actor = resolveUser(principal);
                historyRepository.save(AttendanceAdjustmentHistory.of(
                                request, actor, AdjustmentAction.RESUBMITTED,
                                null, dto.getReasonText(),
                                previousStatus, AdjustmentRequestStatus.PENDING_LEVEL_1));

                // Re-notify level-1 approvers
                WorkflowTemplate template = workflowEngineService.getActiveTemplate(
                                WorkflowType.MANUAL_ATTENDANCE_ADJUSTMENT);
                notifyApprovers(request, template, 1, messages.get(MessageCode.ADJUSTMENT_NOTIFY_RESUBMIT));

                log.info("Employee [{}] resubmitted adjustment request [{}]",
                                request.getEmployee().getEmployeeCode(), requestId);
                return toDetailWithHistory(request, null);
        }

        // ─── Approver actions ─────────────────────────────────────────────────────

        @Override
        public AdjustmentRequestResponse approve(Long requestId,
                        ApprovalActionDto dto,
                        CustomUserPrincipal principal) {
                AttendanceAdjustmentRequest request = loadPendingRequest(requestId);
                assertApproverPermission(principal);

                User actor = resolveUser(principal);
                AdjustmentRequestStatus statusBefore = request.getStatus();
                int levelActedOn = request.getCurrentApprovalLevel();

                request.advanceApproval(actor); // mutates status + level

                requestRepository.save(request);
                historyRepository.save(AttendanceAdjustmentHistory.of(
                                request, actor, AdjustmentAction.APPROVED,
                                levelActedOn, dto.getReason(),
                                statusBefore, request.getStatus()));

                if (request.getStatus() == AdjustmentRequestStatus.APPROVED) {
                        // Apply the correction to the Attendance entity
                        applyApprovedCorrectionToAttendance(request);
                        historyRepository.save(AttendanceAdjustmentHistory.of(
                                        request, null, AdjustmentAction.APPLIED_TO_ATTENDANCE,
                                        null, messages.get(MessageCode.ADJUSTMENT_AUTO_UPDATED),
                                        AdjustmentRequestStatus.APPROVED, AdjustmentRequestStatus.APPROVED));

                        // Notify employee
                        notifyEmployee(request, "ADJUSTMENT_REQUEST_APPROVED",
                                        messages.get(MessageCode.ADJUSTMENT_NOTIFY_APPROVED));
                        log.info("Adjustment request [{}] APPROVED by user [{}]", requestId, principal.getUsername());
                } else {
                        // Notify next level approvers
                        WorkflowTemplate template = workflowEngineService.getActiveTemplate(
                                        WorkflowType.MANUAL_ATTENDANCE_ADJUSTMENT);
                        notifyApprovers(request, template, request.getCurrentApprovalLevel(),
                                        messages.get(MessageCode.ADJUSTMENT_NOTIFY_NEXT_LEVEL,
                                                        request.getCurrentApprovalLevel()));
                        log.info("Adjustment request [{}] advanced to level {} by user [{}]",
                                        requestId, request.getCurrentApprovalLevel(), principal.getUsername());
                }

                return toDetailWithHistory(request, null);
        }

        @Override
        public AdjustmentRequestResponse reject(Long requestId,
                        ApprovalActionDto dto,
                        CustomUserPrincipal principal) {
                assertNonBlankReason(dto.getReason(), messages.get(MessageCode.ADJUSTMENT_REJECT_REASON));

                AttendanceAdjustmentRequest request = loadPendingRequest(requestId);
                assertApproverPermission(principal);

                User actor = resolveUser(principal);
                AdjustmentRequestStatus statusBefore = request.getStatus();
                int levelActedOn = request.getCurrentApprovalLevel();

                request.reject(actor);
                requestRepository.save(request);

                historyRepository.save(AttendanceAdjustmentHistory.of(
                                request, actor, AdjustmentAction.REJECTED,
                                levelActedOn, dto.getReason(),
                                statusBefore, AdjustmentRequestStatus.REJECTED));

                notifyEmployee(request, "ADJUSTMENT_REQUEST_REJECTED",
                                messages.get(MessageCode.ADJUSTMENT_NOTIFY_REJECTED, dto.getReason()));

                log.info("Adjustment request [{}] REJECTED by user [{}] — reason: {}",
                                requestId, principal.getUsername(), dto.getReason());
                return toDetailWithHistory(request, null);
        }

        @Override
        public AdjustmentRequestResponse returnToEmployee(Long requestId,
                        ApprovalActionDto dto,
                        CustomUserPrincipal principal) {
                assertNonBlankReason(dto.getReason(), messages.get(MessageCode.ADJUSTMENT_RETURN_REASON));

                AttendanceAdjustmentRequest request = loadPendingRequest(requestId);
                assertApproverPermission(principal);

                User actor = resolveUser(principal);
                AdjustmentRequestStatus statusBefore = request.getStatus();
                int levelActedOn = request.getCurrentApprovalLevel();

                request.returnToEmployee();
                requestRepository.save(request);

                historyRepository.save(AttendanceAdjustmentHistory.of(
                                request, actor, AdjustmentAction.RETURNED_TO_EMPLOYEE,
                                levelActedOn, dto.getReason(),
                                statusBefore, AdjustmentRequestStatus.RETURNED_TO_EMPLOYEE));

                notifyEmployee(request, "ADJUSTMENT_REQUEST_RETURNED",
                                messages.get(MessageCode.ADJUSTMENT_NOTIFY_RETURNED, dto.getReason()));

                log.info("Adjustment request [{}] RETURNED_TO_EMPLOYEE by user [{}] — reason: {}",
                                requestId, principal.getUsername(), dto.getReason());
                return toDetailWithHistory(request, null);
        }

        // ─── Query methods ────────────────────────────────────────────────────────

        @Override
        @Transactional(readOnly = true)
        public PageResponse<AdjustmentRequestSummaryResponse> getMyRequests(
                        int page, int size, CustomUserPrincipal principal) {
                Employee employee = resolveEmployee(principal);
                Page<AttendanceAdjustmentRequest> pageResult = requestRepository
                                .findByEmployeeId(employee.getId(),
                                                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
                return PageResponse.of(pageResult.map(attendanceMapper::toSummaryResponse));
        }

        @Override
        @Transactional(readOnly = true)
        public PageResponse<AdjustmentRequestSummaryResponse> getPendingForApprover(
                        int page, int size, CustomUserPrincipal principal) {

                List<AdjustmentRequestStatus> pendingStatuses = List.of(
                                AdjustmentRequestStatus.PENDING_LEVEL_1,
                                AdjustmentRequestStatus.PENDING_LEVEL_2,
                                AdjustmentRequestStatus.PENDING_LEVEL_3,
                                AdjustmentRequestStatus.PENDING_LEVEL_4,
                                AdjustmentRequestStatus.PENDING_LEVEL_5);

                boolean isAdmin = hasRole(principal, "ROLE_ADMIN");
                boolean isHr = hasRole(principal, "ROLE_HR");
                boolean isManager = hasRole(principal, "ROLE_MANAGER");

                if (!isAdmin && !isHr && !isManager) {
                        throw new ForbiddenException();
                }

                // Resolve the approver's own employee (to exclude their own requests from
                // inbox)
                Long myEmployeeId = 0L;
                try {
                        myEmployeeId = resolveEmployee(principal).getId();
                } catch (Exception ignored) {
                        /* admin may have no employee record */ }

                // Determine primary role for ROLE-based lookup
                String approverRole = isManager ? "ROLE_MANAGER" : (isHr ? "ROLE_HR" : "ROLE_ADMIN");

                Page<AttendanceAdjustmentRequest> pageResult = requestRepository.findPendingByRoleApprover(
                                pendingStatuses, approverRole, myEmployeeId,
                                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt")));

                return PageResponse.of(pageResult.map(attendanceMapper::toSummaryResponse));
        }

        @Override
        @Transactional(readOnly = true)
        public AdjustmentRequestResponse getDetail(Long requestId, CustomUserPrincipal principal) {
                AttendanceAdjustmentRequest request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new ResourceNotFoundException("AttendanceAdjustmentRequest", "id",
                                                requestId));

                // Employees can only view their own requests
                boolean isPrivileged = hasRole(principal, "ROLE_ADMIN")
                                || hasRole(principal, "ROLE_MANAGER")
                                || hasRole(principal, "ROLE_HR");

                if (!isPrivileged) {
                        Employee employee = resolveEmployee(principal);
                        if (!request.getEmployee().getId().equals(employee.getId())) {
                                throw new ForbiddenException();
                        }
                }

                List<AttendanceAdjustmentHistory> history = historyRepository
                                .findByAdjustmentRequestIdOrderByActionAtAsc(requestId);
                return toDetailWithHistory(request, history);
        }

        // ─── Private: domain helpers ──────────────────────────────────────────────

        private void applyApprovedCorrectionToAttendance(AttendanceAdjustmentRequest request) {
                Attendance attendance;

                if (request.getAttendance() != null) {
                        attendance = request.getAttendance();
                } else {
                        // No existing attendance — create one
                        attendance = Attendance.builder()
                                        .employee(request.getEmployee())
                                        .date(request.getRequestDate())
                                        .isRemote(false)
                                        .isLate(false)
                                        .isOvertime(false)
                                        .build();
                }

                if (request.getProposedCheckInTime() != null) {
                        attendance.setCheckInTime(request.getProposedCheckInTime());
                }
                if (request.getProposedCheckOutTime() != null) {
                        attendance.setCheckOutTime(request.getProposedCheckOutTime());
                }
                attendance.calculateWorkHours();

                // Determine if late based on adjusted check-in
                if (attendance.getCheckInTime() != null) {
                        LocalTime checkInLocalTime = attendance.getCheckInTime().toLocalTime();
                        LocalTime shiftStart = LocalTime.parse(officeProps.getShift1CheckIn());
                        LocalTime shift1End = LocalTime.parse(officeProps.getShift1CheckOut());

                        if (checkInLocalTime.isAfter(shift1End)) {
                                shiftStart = LocalTime.parse(officeProps.getShift2CheckIn());
                        }

                        boolean isLate = checkInLocalTime.isAfter(shiftStart.plusMinutes(officeProps.getGracePeriod()));
                        attendance.setIsLate(isLate);

                        if (isLate) {
                                attendance.setStatus(com.company.ems.backend.attendance.enums.AttendanceStatus.LATE);
                        } else {
                                attendance.setStatus(com.company.ems.backend.attendance.enums.AttendanceStatus.PRESENT);
                        }
                }

                attendanceRepository.save(attendance);
                log.info("Applied approved correction to attendance for employee [{}] on {}",
                                request.getEmployee().getEmployeeCode(), request.getRequestDate());
        }

        private void validateAtLeastOneProposedTime(AdjustmentRequestCreateDto dto) {
                if (dto.getProposedCheckInTime() == null && dto.getProposedCheckOutTime() == null) {
                        throw new BusinessException("MISSING_PROPOSED_TIME",
                                        messages.get(MessageCode.ADJUSTMENT_MISSING_TIME));
                }
        }

        private void assertNonBlankReason(String reason, String errorMessage) {
                if (reason == null || reason.isBlank()) {
                        throw new BusinessException("REASON_REQUIRED",
                                        messages.get(MessageCode.ADJUSTMENT_REASON_REQUIRED, errorMessage));
                }
        }

        private void assertApproverPermission(CustomUserPrincipal principal) {
                boolean canApprove = hasRole(principal, "ROLE_ADMIN")
                                || hasRole(principal, "ROLE_HR")
                                || hasRole(principal, "ROLE_MANAGER")
                                || hasAuthority(principal, "ATTENDANCE_ADJUSTMENT_APPROVE");
                if (!canApprove) {
                        throw new ForbiddenException();
                }
        }

        /** Loads a request that must still be in a PENDING state. */
        private AttendanceAdjustmentRequest loadPendingRequest(Long requestId) {
                AttendanceAdjustmentRequest request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "AttendanceAdjustmentRequest", "id", requestId));
                if (!request.isPending()) {
                        throw new BusinessException("INVALID_REQUEST_STATE",
                                        messages.get(MessageCode.ADJUSTMENT_INVALID_STATE, request.getStatus()));
                }
                return request;
        }

        /** Loads a request and verifies the principal owns it. */
        private AttendanceAdjustmentRequest loadAndAssertOwnership(Long requestId,
                        CustomUserPrincipal principal) {
                AttendanceAdjustmentRequest request = requestRepository.findById(requestId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "AttendanceAdjustmentRequest", "id", requestId));
                Employee employee = resolveEmployee(principal);
                if (!request.getEmployee().getId().equals(employee.getId())) {
                        throw new ForbiddenException();
                }
                return request;
        }

        // ─── Private: notification helpers ───────────────────────────────────────

        private void notifyEmployee(AttendanceAdjustmentRequest req,
                        String eventType, String message) {
                if (req.getEmployee().getUser() == null)
                        return;
                notificationService.send(NotificationEvent.builder()
                                .eventType(eventType)
                                .recipientUserId(req.getEmployee().getUser().getId())
                                .message(message)
                                .referenceId(req.getId())
                                .referenceType("ATTENDANCE_ADJUSTMENT_REQUEST")
                                .build());
        }

        private void notifyApprovers(AttendanceAdjustmentRequest req,
                        WorkflowTemplate template,
                        int level,
                        String message) {
                workflowEngineService.getLevel(template, level).ifPresent(wl -> {
                        workflowEngineService.resolveApproverUserIds(wl)
                                        .forEach(userId -> notificationService.send(NotificationEvent.builder()
                                                        .eventType("ADJUSTMENT_REQUEST_PENDING")
                                                        .recipientUserId(userId)
                                                        .message(message)
                                                        .referenceId(req.getId())
                                                        .referenceType("ATTENDANCE_ADJUSTMENT_REQUEST")
                                                        .build()));
                });
        }

        // ─── Private: resolve helpers ──────────────────────────────────────────────

        private Employee resolveEmployee(CustomUserPrincipal principal) {
                return employeeRepository.findByUserId(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                messages.get(MessageCode.EMPLOYEE_NOT_FOUND_FOR_USER,
                                                                principal.getUserId())));
        }

        private User resolveUser(CustomUserPrincipal principal) {
                return userRepository.findById(principal.getUserId())
                                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getUserId()));
        }

        private boolean hasRole(CustomUserPrincipal p, String role) {
                return p.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals(role)
                                                || a.getAuthority().equals("ROLE_" + role));
        }

        private boolean hasAuthority(CustomUserPrincipal p, String authority) {
                return p.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals(authority));
        }

        // ─── Private: mappers ──────────────────────────────────────────────────────

        /**
         * Thin wrapper: delegates field mapping to AttendanceMapper, then attaches
         * history.
         */
        private AdjustmentRequestResponse toDetailWithHistory(
                        AttendanceAdjustmentRequest r,
                        List<AttendanceAdjustmentHistory> historyList) {

                AdjustmentRequestResponse dto = attendanceMapper.toDetailResponse(r);
                if (historyList != null) {
                        dto.setHistory(historyList.stream()
                                        .map(attendanceMapper::toHistoryResponse)
                                        .collect(Collectors.toList()));
                }
                return dto;
        }
}