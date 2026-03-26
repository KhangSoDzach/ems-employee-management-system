package com.company.ems.backend.asset.incident.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.entity.AssetHistory;
import com.company.ems.backend.asset.enums.AssetActionType;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.entity.AssetIncidentReport;
import com.company.ems.backend.asset.incident.entity.IncidentType;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import com.company.ems.backend.asset.incident.repository.AssetIncidentReportRepository;
import com.company.ems.backend.asset.repository.AssetHistoryRepository;
import com.company.ems.backend.asset.repository.AssetRepository;
import com.company.ems.backend.auditlog.enums.AuditAction;
import com.company.ems.backend.auditlog.enums.ResourceType;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {

    private final AssetIncidentReportRepository incidentRepo;
    private final AssetRepository assetRepo;
    private final AssetHistoryRepository historyRepo;
    private final EmployeeRepository employeeRepo;
    private final UserRepository userRepo;
    private final AuditLogService auditLogService;
    private final IncidentCodeGenerator codeGenerator;
    private final IncidentMapper mapper;
    private final MessageService messages;
    private static final String UPLOAD_DIR = "uploads/incidents/";
    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "application/pdf");

    @Override
    @Transactional(readOnly = true)
    public PageResponse<IncidentDto.MyAsset> getMyAssets(CustomUserPrincipal principal) {
        Employee emp = resolveEmployee(principal);
        List<Asset> assets = assetRepo.findByAssignedToId(emp.getId());
        List<IncidentDto.MyAsset> content = assets.stream()
                .map(a -> IncidentDto.MyAsset.builder()
                        .id(a.getId())
                        .name(a.getAssetName())
                        .tag(a.getAssetCode())
                        .assetType(a.getAssetType())
                        .imageUrl(a.getImageUrl())
                        .build())
                .toList();

        return PageResponse.of(content, 0, content.size(), content.size(), 1,
                messages.get(MessageCode.PAGE_ENTITY_ASSET));
    }

    @Override
    @Transactional
    public ApiResponse<IncidentDto.ReportDetail> submitReport(
            Long assetId,
            IncidentDto.SubmitRequest request,
            MultipartFile attachment,
            CustomUserPrincipal principal) {

        Employee emp = resolveEmployee(principal);
        Asset asset = assetRepo.findActiveById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", assetId));
        if (asset.getAssignedTo() == null
                || !asset.getAssignedTo().getId().equals(emp.getId())) {
            throw new AccessDeniedException(messages.get(MessageCode.INCIDENT_ASSET_NOT_ASSIGNED));
        }

        String attachmentUrl = null;
        if (attachment != null && !attachment.isEmpty()) {
            attachmentUrl = saveAttachment(attachment);
        }

        AssetIncidentReport report = AssetIncidentReport.builder()
                .reportCode(codeGenerator.nextCode())
                .asset(asset)
                .incidentType(request.getIncidentType())
                .description(request.getDescription())
                .attachmentUrl(attachmentUrl)
                .status(ReportStatus.PENDING)
                .reportedBy(emp)
                .reportedAt(LocalDateTime.now())
                .build();

        @SuppressWarnings("null")
        AssetIncidentReport savedReport = incidentRepo.save(report);

        auditLogService.logEvent(
                ResourceType.ASSET,
                AuditAction.CREATE,
                emp.getUser().getUsername(),
                savedReport.getReportCode(),
                emp.getFullName(),
                new AuditLogService.AuditValues(
                        null,
                        "{\"asset\":\"" + asset.getAssetCode() + "\", \"type\":\"" + savedReport.getIncidentType()
                                + "\"}"),
                null);

        log.info("Incident report created: {} by employee: {}", savedReport.getReportCode(), emp.getId());

        return ApiResponse.success(messages.get(MessageCode.INCIDENT_SUBMITTED), mapper.toDetail(savedReport));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<IncidentDto.ReportRow> getMyReports(
            int page, int size, CustomUserPrincipal principal) {

        Employee emp = resolveEmployee(principal);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "reportedAt"));
        Page<AssetIncidentReport> result = incidentRepo.findByEmployee(emp.getId(), pageable);

        return PageResponse.of(result.map(mapper::toRow), messages.get(MessageCode.PAGE_ENTITY_REPORT));
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentDto.ReportDetail getMyReportDetail(Long id, CustomUserPrincipal principal) {
        Employee emp = resolveEmployee(principal);
        AssetIncidentReport report = findReportById(id);

        if (!report.getReportedBy().getId().equals(emp.getId())) {
            throw new AccessDeniedException(messages.get(MessageCode.INCIDENT_ACCESS_DENIED));
        }
        return mapper.toDetail(report);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<IncidentDto.AdminListItem> getAllReports(
            ReportStatus status, Long employeeId,
            String fromDate, String toDate, String keyword,
            int page, int size) {

        LocalDateTime from = parseDate(fromDate, true);
        LocalDateTime to = parseDate(toDate, false);

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "reportedAt"));
        Page<AssetIncidentReport> result = incidentRepo.findAllFiltered(
                status, employeeId, from, to,
                StringUtils.hasText(keyword) ? keyword : null,
                pageable);

        return PageResponse.of(result.map(mapper::toAdminItem), messages.get(MessageCode.PAGE_ENTITY_REPORT));
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentDto.ReportDetail getReportDetail(Long id) {
        return mapper.toDetail(findReportById(id));
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public ApiResponse<IncidentDto.ReportDetail> approveReport(
            Long id,
            IncidentDto.ProcessRequest request,
            CustomUserPrincipal principal) {

        AssetIncidentReport report = findReportById(id);
        // FIX: Idempotent — concurrent/double request (React StrictMode) returns
        // current state
        if (report.getStatus() == ReportStatus.APPROVED) {
            log.info("approveReport: report [{}] already APPROVED — idempotent return", id);
            return ApiResponse.success(messages.get(MessageCode.INCIDENT_APPROVED), mapper.toDetail(report));
        }
        validateNotAlreadyProcessed(report);

        User processor = resolveUser(principal);
        if (report.getReportedBy().getUser() != null
                && report.getReportedBy().getUser().getId().equals(processor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn không thể tự duyệt báo cáo của bản thân.");
        }
        report.setStatus(ReportStatus.APPROVED);
        report.setProcessedBy(processor);
        report.setProcessedAt(LocalDateTime.now());
        report.setProcessNote(request != null ? request.getNote() : null);
        Asset asset = report.getAsset();
        AssetCondition oldCondition = asset.getCondition();
        AssetCondition newCondition = resolveConditionOnApprove(report.getIncidentType());
        asset.setCondition(newCondition);
        assetRepo.save(asset);

        historyRepo.save(AssetHistory.builder()
                .asset(asset)
                .actionType(AssetActionType.CHANGE_CONDITION)
                .actorId(processor.getId())
                .actorUsername(processor.getUsername())
                .detail("Phê duyệt báo cáo: " + report.getReportCode() + " — cập nhật tình trạng tài sản")
                .oldValue("{\"condition\":\"" + oldCondition.name() + "\"}")
                .newValue("{\"condition\":\"" + newCondition.name() + "\"}")
                .build());

        incidentRepo.save(report);

        auditLogService.logEvent(
                ResourceType.ASSET,
                AuditAction.UPDATE,
                processor.getUsername(),
                report.getReportCode(),
                report.getReportedBy().getFullName(),
                new AuditLogService.AuditValues(oldCondition.name(), newCondition.name()),
                null);

        if (newCondition == AssetCondition.LOST) {
            log.info("Asset reported LOST. Should initiate payroll compensation process for asset: {}",
                    asset.getAssetCode());
        }

        log.info("Report {} approved by {} — asset {} condition → {}",
                report.getReportCode(), processor.getUsername(),
                asset.getAssetCode(), newCondition);

        return ApiResponse.success(messages.get(MessageCode.INCIDENT_APPROVED), mapper.toDetail(report));
    }

    @Override
    @Transactional
    public ApiResponse<IncidentDto.ReportDetail> rejectReport(
            Long id,
            IncidentDto.ProcessRequest request,
            CustomUserPrincipal principal) {

        AssetIncidentReport report = findReportById(id);
        // FIX: Idempotent — if already REJECTED, return current state
        if (report.getStatus() == ReportStatus.REJECTED) {
            log.info("rejectReport: report [{}] already REJECTED — idempotent return", id);
            return ApiResponse.success(messages.get(MessageCode.INCIDENT_REJECTED), mapper.toDetail(report));
        }
        validateNotAlreadyProcessed(report);

        User processor = resolveUser(principal);
        if (report.getReportedBy().getUser() != null
                && report.getReportedBy().getUser().getId().equals(processor.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn không thể tự duyệt báo cáo của bản thân.");
        }

        report.setStatus(ReportStatus.REJECTED);
        report.setProcessedBy(processor);
        report.setProcessedAt(LocalDateTime.now());
        report.setProcessNote(request != null ? request.getNote() : null);

        incidentRepo.save(report);

        auditLogService.logEvent(
                ResourceType.ASSET,
                AuditAction.UPDATE,
                processor.getUsername(),
                report.getReportCode(),
                report.getReportedBy().getFullName(),
                new AuditLogService.AuditValues(null, "REJECTED: " + report.getProcessNote()),
                null);

        log.info("Report {} rejected by {}", report.getReportCode(), processor.getUsername());

        return ApiResponse.success(messages.get(MessageCode.INCIDENT_REJECTED), mapper.toDetail(report));
    }

    private AssetIncidentReport findReportById(Long id) {
        Long reportId = Objects.requireNonNull(id, "report id must not be null");
        return incidentRepo.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("AssetIncidentReport", "id", id));
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

    private void validateNotAlreadyProcessed(AssetIncidentReport report) {
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new IllegalStateException(
                    messages.get(MessageCode.INCIDENT_ALREADY_PROCESSED, report.getStatus().name()));
        }
    }

    private AssetCondition resolveConditionOnApprove(IncidentType type) {
        return switch (type) {
            case HARDWARE_ISSUE, DAMAGED -> AssetCondition.DAMAGED;
            case LOST_ASSET, LOST -> AssetCondition.LOST;
        };
    }

    private String saveAttachment(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(messages.get(MessageCode.INCIDENT_FILE_INVALID_TYPE));
        }

        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException(messages.get(MessageCode.INCIDENT_FILE_TOO_LARGE));
        }

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            Files.createDirectories(uploadPath);

            String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + (ext != null ? "." + ext : "");
            Path target = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), target);

            return "/" + UPLOAD_DIR + filename;
        } catch (IOException e) {
            log.error("Failed to save attachment", e);
            throw new IllegalStateException("Failed to save attachment", e);
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