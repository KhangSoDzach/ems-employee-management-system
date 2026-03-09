package com.company.ems.backend.asset.incident.service;

import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.entity.AssetIncidentReport;
import com.company.ems.backend.asset.incident.entity.IncidentType;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import com.company.ems.backend.asset.incident.repository.AssetIncidentReportRepository;
import com.company.ems.backend.asset.repository.AssetRepository;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {

    private final AssetIncidentReportRepository incidentRepo;
    private final AssetRepository               assetRepo;
    private final EmployeeRepository            employeeRepo;
    private final UserRepository                userRepo;
    private final IncidentCodeGenerator         codeGenerator;
    private final MessageService messages;
    private final IncidentMapper                mapper;

    private static final String UPLOAD_DIR     = "uploads/incidents/";
    private static final long   MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "application/pdf");

    @Override
    @Transactional(readOnly = true)
    public PageResponse<IncidentDto.MyAsset> getMyAssets(CustomUserPrincipal principal) {
        Employee emp = resolveEmployee(principal);
        Page<Asset> page = assetRepo.findFiltered(
                AssetStatus.ASSIGNED, null, null,
                PageRequest.of(0, 50, Sort.by("assetName")));

        List<IncidentDto.MyAsset> content = page.getContent().stream()
                .filter(a -> a.getAssignedTo() != null
                        && a.getAssignedTo().getId().equals(emp.getId()))
                .map(a -> IncidentDto.MyAsset.builder()
                        .id(a.getId())
                        .name(a.getAssetName())
                        .tag(a.getAssetCode())
                        .assetType(a.getAssetType())
                        .imageUrl(a.getImageUrl())
                        .build())
                .toList();

        return PageResponse.of(content, 0, content.size(), content.size(), 1, messages.get(MessageCode.PAGE_ENTITY_ASSET));
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

        incidentRepo.save(report);

        log.info("Incident report created: {} by employee: {}", report.getReportCode(), emp.getId());

        return ApiResponse.success(messages.get(MessageCode.INCIDENT_SUBMITTED), mapper.toDetail(report));
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
        LocalDateTime to   = parseDate(toDate, false);

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
    public ApiResponse<IncidentDto.ReportDetail> approveReport(
            Long id,
            IncidentDto.ProcessRequest request,
            CustomUserPrincipal principal) {

        AssetIncidentReport report = findReportById(id);
        validateNotAlreadyProcessed(report);

        User processor = resolveUser(principal);
        report.setStatus(ReportStatus.APPROVED);
        report.setProcessedBy(processor);
        report.setProcessedAt(LocalDateTime.now());
        report.setProcessNote(request != null ? request.getNote() : null);
        Asset asset = report.getAsset();
        AssetCondition newCondition = resolveConditionOnApprove(report.getIncidentType());
        asset.setCondition(newCondition);

        incidentRepo.save(report);
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
        validateNotAlreadyProcessed(report);

        User processor = resolveUser(principal);

        report.setStatus(ReportStatus.REJECTED);
        report.setProcessedBy(processor);
        report.setProcessedAt(LocalDateTime.now());
        report.setProcessNote(request != null ? request.getNote() : null);

        incidentRepo.save(report);
        log.info("Report {} rejected by {}", report.getReportCode(), processor.getUsername());

        return ApiResponse.success(messages.get(MessageCode.INCIDENT_REJECTED), mapper.toDetail(report));
    }

    private AssetIncidentReport findReportById(Long id) {
        return incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AssetIncidentReport", "id", id));
    }

    private Employee resolveEmployee(CustomUserPrincipal principal) {
        return employeeRepo.findByUserId(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "userId", principal.getUserId()));
    }

    private User resolveUser(CustomUserPrincipal principal) {
        return userRepo.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getUserId()));
    }

    private void validateNotAlreadyProcessed(AssetIncidentReport report) {
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new IllegalStateException(messages.get(MessageCode.INCIDENT_ALREADY_PROCESSED, report.getStatus().name()));
        }
    }

    private AssetCondition resolveConditionOnApprove(IncidentType type) {
        return switch (type) {
            case HARDWARE_MALFUNCTION, SCREEN_FLICKERING,
                 BATTERY_ISSUE, PERIPHERAL_NOT_WORKING,
                 SOFTWARE_OS_ISSUE, OTHER -> AssetCondition.DAMAGED;
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

            String ext      = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + (ext != null ? "." + ext : "");
            Path   target   = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), target);

            return "/" + UPLOAD_DIR + filename;
        } catch (Exception e) {
            log.error("Failed to save attachment", e);
            throw new RuntimeException(e.getMessage());
        }
    }

    private LocalDateTime parseDate(String dateStr, boolean startOfDay) {
        if (!StringUtils.hasText(dateStr)) return null;
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE);
            return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
        } catch (Exception e) {
            return null;
        }
    }
}