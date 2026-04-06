package com.company.ems.backend.attendance.mapper;

import com.company.ems.backend.attendance.dto.AttendanceResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestResponse;
import com.company.ems.backend.attendance.dto.adjustment.AdjustmentRequestSummaryResponse;
import com.company.ems.backend.attendance.dto.adjustment.AttendanceAdjustmentHistoryResponse;
import com.company.ems.backend.attendance.entity.AttendanceAdjustmentHistory;
import com.company.ems.backend.attendance.entity.AttendanceAdjustmentRequest;
import com.company.ems.backend.attendance.entity.Attendance;
import com.company.ems.backend.config.StorageProperties;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class AttendanceMapper {

    @Autowired
    protected StorageProperties storageProperties;

    // Attendance -> AttendanceResponse
    @Mapping(target = "employeeId",       source = "employee.id")
    @Mapping(target = "employeeName",     expression = "java(a.getEmployee() != null ? a.getEmployee().getFirstName() + \" \" + a.getEmployee().getLastName() : null)")
    @Mapping(target = "employeeCode",     source = "employee.employeeCode")
    @Mapping(target = "status",           expression = "java(a.getStatus() != null ? a.getStatus().name() : null)")
    @Mapping(target = "checkInMethod",    expression = "java(a.getCheckInMethod() != null ? a.getCheckInMethod().name() : null)")
    @Mapping(target = "checkInPhotoUrl",  source = "checkInPhotoUrl",  qualifiedByName = "buildPhotoUrl")
    @Mapping(target = "checkOutPhotoUrl", source = "checkOutPhotoUrl", qualifiedByName = "buildPhotoUrl")
    @Mapping(target = "approvedByName",   source = "approvedBy.username")
    public abstract AttendanceResponse toResponse(Attendance a);

    /** Relative path -> absolute URL. Moved here from AttendanceServiceImpl. */
    @Named("buildPhotoUrl")
    protected String buildPhotoUrl(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return null;
        if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
            return relativePath;
        }
        String base = storageProperties.getBaseUrl();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + "/" + relativePath;
    }

    // AttendanceAdjustmentRequest -> AdjustmentRequestSummaryResponse
    @Mapping(target = "employeeName", expression = "java(r.getEmployee() != null ? r.getEmployee().getFirstName() + \" \" + r.getEmployee().getLastName() : null)")
    @Mapping(target = "employeeCode", source = "employee.employeeCode")
    @Mapping(target = "reasonType",   expression = "java(r.getReasonType() != null ? r.getReasonType().name() : null)")
    @Mapping(target = "status",       expression = "java(r.getStatus() != null ? r.getStatus().name() : null)")
    public abstract AdjustmentRequestSummaryResponse toSummaryResponse(AttendanceAdjustmentRequest r);

    // AttendanceAdjustmentRequest -> AdjustmentRequestResponse (history injected separately)
    @Mapping(target = "employeeId",    source = "employee.id")
    @Mapping(target = "employeeName",  expression = "java(r.getEmployee() != null ? r.getEmployee().getFirstName() + \" \" + r.getEmployee().getLastName() : null)")
    @Mapping(target = "employeeCode",  source = "employee.employeeCode")
    @Mapping(target = "attendanceId",  source = "attendance.id")
    @Mapping(target = "reasonType",    expression = "java(r.getReasonType() != null ? r.getReasonType().name() : null)")
    @Mapping(target = "status",        expression = "java(r.getStatus() != null ? r.getStatus().name() : null)")
    @Mapping(target = "resolvedByName",source = "resolvedBy.username")
    @Mapping(target = "history",       ignore = true)
    public abstract AdjustmentRequestResponse toDetailResponse(AttendanceAdjustmentRequest r);

    // AttendanceAdjustmentHistory -> AttendanceAdjustmentHistoryResponse
    @Mapping(target = "actionByName",   source = "actionBy.username")
    @Mapping(target = "actionByUserId", source = "actionBy.id")
    @Mapping(target = "action",       expression = "java(h.getAction() != null ? h.getAction().name() : null)")
    @Mapping(target = "statusBefore", expression = "java(h.getStatusBefore() != null ? h.getStatusBefore().name() : null)")
    @Mapping(target = "statusAfter",  expression = "java(h.getStatusAfter() != null ? h.getStatusAfter().name() : null)")
    public abstract AttendanceAdjustmentHistoryResponse toHistoryResponse(AttendanceAdjustmentHistory h);
}