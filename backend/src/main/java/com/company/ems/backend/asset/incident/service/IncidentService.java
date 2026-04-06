package com.company.ems.backend.asset.incident.service;

import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import org.springframework.web.multipart.MultipartFile;

public interface IncidentService {
    PageResponse<IncidentDto.MyAsset> getMyAssets(CustomUserPrincipal principal);

    ApiResponse<IncidentDto.ReportDetail> submitReport(
            Long assetId,
            IncidentDto.SubmitRequest request,
            MultipartFile attachment,
            CustomUserPrincipal principal);

    PageResponse<IncidentDto.ReportRow> getMyReports(
            int page, int size,
            CustomUserPrincipal principal);

    IncidentDto.ReportDetail getMyReportDetail(Long id, CustomUserPrincipal principal);

    PageResponse<IncidentDto.AdminListItem> getAllReports(
            ReportStatus status,
            Long employeeId,
            String fromDate,
            String toDate,
            String keyword,
            int page, int size);

    IncidentDto.ReportDetail getReportDetail(Long id);

    ApiResponse<IncidentDto.ReportDetail> approveReport(
            Long id,
            IncidentDto.ProcessRequest request,
            CustomUserPrincipal principal);

    ApiResponse<IncidentDto.ReportDetail> rejectReport(
            Long id,
            IncidentDto.ProcessRequest request,
            CustomUserPrincipal principal);
}