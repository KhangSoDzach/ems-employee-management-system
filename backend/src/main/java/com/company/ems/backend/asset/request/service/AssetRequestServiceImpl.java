package com.company.ems.backend.asset.request.service;

import com.company.ems.backend.asset.request.dto.AssetRequestDto;
import com.company.ems.backend.asset.request.entity.AssetRequest;
import com.company.ems.backend.asset.request.enums.AssetRequestStatus;
import com.company.ems.backend.asset.request.repository.AssetRequestRepository;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetRequestServiceImpl implements AssetRequestService {

    private static final String ENTITY_TYPE_ASSET_REQUEST = "ASSET_REQUEST";
    private final AssetRequestRepository requestRepo;
    private final EmployeeRepository employeeRepo;
    private final UserRepository userRepo;
    private final AuditLogService auditLogService;
    private final RequestCodeGenerator codeGenerator;
    private final RequestMapper mapper;

    @Override
    @Transactional
    public ApiResponse<AssetRequestDto.RequestDetail> submitRequest(
            AssetRequestDto.SubmitRequest requestDto,
            CustomUserPrincipal principal) {

        Employee emp = resolveEmployee(principal);

        AssetRequest request = AssetRequest.builder()
                .requestCode(codeGenerator.nextCode())
                .requestedBy(emp)
                .assetType(requestDto.getAssetType())
                .reason(requestDto.getReason())
                .priority(requestDto.getPriority())
                .status(AssetRequestStatus.PENDING)
                .build();

        AssetRequest savedRequest = requestRepo.save(request);

        auditLogService.logEvent(
                ENTITY_TYPE_ASSET_REQUEST,
                AuthActionType.ASSET_REQUEST_SUBMITTED,
                emp.getUser().getUsername(),
                savedRequest.getRequestCode(),
                null,
                new AuditLogService.AuditValues(
                        null,
                        "{\"assetType\":\"" + savedRequest.getAssetType() + "\"}"),
                null);

        log.info("Asset request created: {} by employee: {}", savedRequest.getRequestCode(), emp.getId());

        return ApiResponse.success("Asset request submitted successfully", mapper.toDetail(savedRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetRequestDto.RequestRow> getMyRequests(
            int page, int size, CustomUserPrincipal principal) {

        Employee emp = resolveEmployee(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AssetRequest> result = requestRepo.findByRequestedBy_Id(emp.getId(), pageable);

        return PageResponse.of(result.map(mapper::toRow), "Asset requests retrieved successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public AssetRequestDto.RequestDetail getMyRequestDetail(Long id, CustomUserPrincipal principal) {
        Employee emp = resolveEmployee(principal);
        AssetRequest request = findRequestById(id);

        if (!request.getRequestedBy().getId().equals(emp.getId())) {
            throw new AccessDeniedException("You do not have permission to view this asset request");
        }
        return mapper.toDetail(request);
    }

    @Override
    @Transactional
    public ApiResponse<AssetRequestDto.RequestDetail> cancelRequest(
            Long id,
            CustomUserPrincipal principal) {

        Employee emp = resolveEmployee(principal);
        AssetRequest request = findRequestById(id);

        if (!request.getRequestedBy().getId().equals(emp.getId())) {
            throw new AccessDeniedException("You do not have permission to cancel this asset request");
        }

        if (request.getStatus() != AssetRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be cancelled");
        }

        request.setStatus(AssetRequestStatus.CANCELLED);
        AssetRequest savedRequest = requestRepo.save(request);

        auditLogService.logEvent(
                ENTITY_TYPE_ASSET_REQUEST,
                AuthActionType.ASSET_REQUEST_CANCELLED,
                emp.getUser().getUsername(),
                savedRequest.getRequestCode(),
                null,
                new AuditLogService.AuditValues(STATUS_PENDING, "CANCELLED"),
                null);

        log.info("Asset request {} cancelled by employee {}", request.getRequestCode(), emp.getId());

        return ApiResponse.success("Asset request cancelled successfully", mapper.toDetail(savedRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AssetRequestDto.AdminListItem> getAllRequests(
            AssetRequestStatus status, Long employeeId,
            String fromDate, String toDate, String keyword,
            int page, int size) {

        LocalDateTime from = parseDate(fromDate, true);
        LocalDateTime to = parseDate(toDate, false);

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AssetRequest> result = requestRepo.findAllFiltered(
                status, employeeId, from, to,
                StringUtils.hasText(keyword) ? keyword : null,
                pageable);

        return PageResponse.of(result.map(mapper::toAdminItem), "Asset requests retrieved successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public AssetRequestDto.RequestDetail getRequestDetail(Long id) {
        return mapper.toDetail(findRequestByIdWithDetails(id));
    }

    @Override
    @Transactional
    public ApiResponse<AssetRequestDto.RequestDetail> approveRequest(
            Long id,
            AssetRequestDto.ProcessRequest requestDto,
            CustomUserPrincipal principal) {

        AssetRequest request = findRequestById(id);
        validateNotAlreadyProcessed(request);

        User processor = resolveUser(principal);
        if (request.getRequestedBy().getUser() != null && request.getRequestedBy().getUser().getId().equals(processor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không thể tự duyệt yêu cầu của bản thân.");
        }
        request.setStatus(AssetRequestStatus.APPROVED);
        request.setReviewedBy(processor);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNote(requestDto != null ? requestDto.getNote() : null);

        AssetRequest savedRequest = requestRepo.save(request);

        auditLogService.logEvent(
                ENTITY_TYPE_ASSET_REQUEST,
                AuthActionType.ASSET_REQUEST_APPROVED,
                processor.getUsername(),
                request.getRequestCode(),
                null,
                new AuditLogService.AuditValues(STATUS_PENDING, "APPROVED"),
                null);

        log.info("Asset request {} approved by {}", request.getRequestCode(), processor.getUsername());

        return ApiResponse.success("Asset request approved successfully", mapper.toDetail(savedRequest));
    }

    @Override
    @Transactional
    public ApiResponse<AssetRequestDto.RequestDetail> rejectRequest(
            Long id,
            AssetRequestDto.ProcessRequest requestDto,
            CustomUserPrincipal principal) {

        AssetRequest request = findRequestById(id);
        validateNotAlreadyProcessed(request);

        User processor = resolveUser(principal);
        if (request.getRequestedBy().getUser() != null && request.getRequestedBy().getUser().getId().equals(processor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không thể tự duyệt yêu cầu của bản thân.");
        }

        request.setStatus(AssetRequestStatus.REJECTED);
        request.setReviewedBy(processor);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewNote(requestDto != null ? requestDto.getNote() : null);

        AssetRequest savedRequest = requestRepo.save(request);

        auditLogService.logEvent(
                ENTITY_TYPE_ASSET_REQUEST,
                AuthActionType.ASSET_REQUEST_REJECTED,
                processor.getUsername(),
                request.getRequestCode(),
                null,
                new AuditLogService.AuditValues(STATUS_PENDING, "REJECTED" + (request.getReviewNote() != null ? ": " + request.getReviewNote() : "")),
                null);

        log.info("Asset request {} rejected by {}", request.getRequestCode(), processor.getUsername());

        return ApiResponse.success("Asset request rejected successfully", mapper.toDetail(savedRequest));
    }

    private static final String STATUS_PENDING = "PENDING";

    private AssetRequest findRequestById(Long id) {
        Long requestId = Objects.requireNonNull(id, "request id must not be null");
        return requestRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetRequest", "id", id));
    }

    private AssetRequest findRequestByIdWithDetails(Long id) {
        Long requestId = Objects.requireNonNull(id, "request id must not be null");
        return requestRepo.findByIdWithDetails(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetRequest", "id", id));
    }

    private Employee resolveEmployee(CustomUserPrincipal principal) {
        return employeeRepo.findByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", principal.getUserId()));
    }

    private User resolveUser(CustomUserPrincipal principal) {
        Long userId = Objects.requireNonNull(principal.getUserId(), "principal userId must not be null");
        return userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getUserId()));
    }

    private void validateNotAlreadyProcessed(AssetRequest request) {
        if (request.getStatus() != AssetRequestStatus.PENDING) {
            throw new IllegalStateException(
                    "Asset request has already been processed and is currently " + request.getStatus().name());
        }
    }

    private LocalDateTime parseDate(String dateStr, boolean startOfDay) {
        if (!StringUtils.hasText(dateStr))
            return null;
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE);
            return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}
