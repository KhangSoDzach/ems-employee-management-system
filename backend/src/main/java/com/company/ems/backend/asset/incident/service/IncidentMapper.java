package com.company.ems.backend.asset.incident.service;

import com.company.ems.backend.asset.incident.dto.IncidentDto;
import com.company.ems.backend.asset.incident.entity.AssetIncidentReport;
import com.company.ems.backend.asset.incident.entity.IncidentType;
import com.company.ems.backend.asset.incident.entity.ReportStatus;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;

@Component
public class IncidentMapper {

        private static final DateTimeFormatter ROW_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH);
        private static final DateTimeFormatter DETAIL_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm",
                        Locale.ENGLISH);

        private static final Map<ReportStatus, String> STATUS_LABEL = Map.of(
                        ReportStatus.PENDING, "Pending",
                        ReportStatus.APPROVED, "Approved",
                        ReportStatus.REJECTED, "Rejected",
                        ReportStatus.RESOLVED, "Resolved");

        private static final Map<ReportStatus, String> STATUS_COLOR = Map.of(
                        ReportStatus.PENDING, "bg-amber-50 text-amber-600 border border-amber-300",
                        ReportStatus.APPROVED, "bg-emerald-50 text-emerald-600 border border-emerald-300",
                        ReportStatus.REJECTED, "bg-red-50 text-red-600 border border-red-300",
                        ReportStatus.RESOLVED, "bg-blue-50 text-blue-600 border border-blue-300");

        private static final Map<IncidentType, String> TYPE_LABEL = Map.of(
                        IncidentType.DAMAGED, "Hư hỏng (Damaged)",
                        IncidentType.LOST, "Mất mát (Lost)");

        public IncidentDto.ReportRow toRow(AssetIncidentReport r) {
                return IncidentDto.ReportRow.builder()
                                .id(r.getId())
                                .reportId(r.getReportCode())
                                .asset(r.getAsset().getAssetName())
                                .assetTag(r.getAsset().getAssetCode())
                                .issueType(TYPE_LABEL.getOrDefault(r.getIncidentType(), r.getIncidentType().name()))
                                .dateReported(r.getReportedAt().format(ROW_FMT))
                                .status(r.getStatus().name())
                                .statusLabel(STATUS_LABEL.get(r.getStatus()))
                                .statusColor(STATUS_COLOR.get(r.getStatus()))
                                .build();
        }

        public IncidentDto.ReportDetail toDetail(AssetIncidentReport r) {
                return IncidentDto.ReportDetail.builder()
                                .id(r.getId())
                                .reportId(r.getReportCode())
                                .asset(r.getAsset().getAssetName())
                                .assetCode(r.getAsset().getAssetCode())
                                .assetTag(r.getAsset().getAssetCode())
                                .incidentType(r.getIncidentType().name())
                                .incidentTypeLabel(TYPE_LABEL.getOrDefault(r.getIncidentType(),
                                                r.getIncidentType().name()))
                                .description(r.getDescription())
                                .attachmentUrl(r.getAttachmentUrl())
                                .status(r.getStatus().name())
                                .statusLabel(STATUS_LABEL.get(r.getStatus()))
                                .statusColor(STATUS_COLOR.get(r.getStatus()))
                                .reportedBy(r.getReportedBy().getFullName())
                                .reportedAt(r.getReportedAt().format(DETAIL_FMT))
                                .processedBy(r.getProcessedBy() != null ? r.getProcessedBy().getUsername() : null)
                                .processedAt(r.getProcessedAt() != null ? r.getProcessedAt().format(DETAIL_FMT) : null)
                                .processNote(r.getProcessNote())
                                .assetCondition(r.getAsset().getCondition().name())
                                .assetStatus(r.getAsset().getStatus().name())
                                .build();
        }

        public IncidentDto.AdminListItem toAdminItem(AssetIncidentReport r) {
                return IncidentDto.AdminListItem.builder()
                                .id(r.getId())
                                .reportId(r.getReportCode())
                                .asset(r.getAsset().getAssetName())
                                .employeeName(r.getReportedBy().getFullName())
                                .issueType(r.getIncidentType().name())
                                .issueTypeLabel(TYPE_LABEL.getOrDefault(r.getIncidentType(),
                                                r.getIncidentType().name()))
                                .reportedAt(r.getReportedAt().format(ROW_FMT))
                                .status(r.getStatus().name())
                                .statusLabel(STATUS_LABEL.get(r.getStatus()))
                                .statusColor(STATUS_COLOR.get(r.getStatus()))
                                .build();
        }
}