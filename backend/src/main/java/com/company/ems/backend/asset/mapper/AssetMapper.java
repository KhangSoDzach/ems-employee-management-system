package com.company.ems.backend.asset.mapper;
import com.company.ems.backend.asset.dto.AssetDto;
import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.entity.AssetHistory;
import com.company.ems.backend.asset.enums.AssetActionType;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.employee.entity.Employee;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class AssetMapper {

    private static final DateTimeFormatter DATE_FMT      = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT  = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DETAIL_DT_FMT = DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");

    private static final Map<AssetStatus, String> STATUS_LABELS = Map.of(
            AssetStatus.AVAILABLE, "Sẵn dùng",
            AssetStatus.ASSIGNED,  "Đang cấp phát",
            AssetStatus.RETIRED,   "Đã thu hồi"
    );

    private static final Map<AssetStatus, String> STATUS_LABELS_UPPER = Map.of(
            AssetStatus.AVAILABLE, "ĐANG SẴN SÀNG",
            AssetStatus.ASSIGNED,  "ĐANG CẤP PHÁT",
            AssetStatus.RETIRED,   "ĐÃ THU HỒI"
    );

    private static final Map<AssetStatus, String> STATUS_COLORS = Map.of(
            AssetStatus.AVAILABLE, "bg-green-100 text-green-700",
            AssetStatus.ASSIGNED,  "bg-blue-100 text-blue-700",
            AssetStatus.RETIRED,   "bg-yellow-100 text-yellow-700"
    );

    public static final Map<AssetCondition, String> CONDITION_LABELS = Map.of(
            AssetCondition.NEW,      "Mới",
            AssetCondition.GOOD,     "Tốt",
            AssetCondition.DAMAGED,  "Hỏng",
            AssetCondition.LOST,     "Thất lạc",
            AssetCondition.DISPOSED, "Thanh lý"
    );

    private static final Map<AssetActionType, String> HISTORY_TYPE = Map.of(
            AssetActionType.ASSIGN_ASSET,     "assign",
            AssetActionType.RETURN_ASSET,     "return",
            AssetActionType.RETIRE_ASSET,     "return",
            AssetActionType.CREATE_ASSET,     "update",
            AssetActionType.UPDATE_ASSET,     "update",
            AssetActionType.CHANGE_CONDITION, "update",
            AssetActionType.SOFT_DELETE,      "update"
    );

    public static final Map<AssetActionType, String> ACTION_LABELS = Map.of(
            AssetActionType.ASSIGN_ASSET,     "Cấp phát",
            AssetActionType.RETURN_ASSET,     "Thu hồi",
            AssetActionType.RETIRE_ASSET,     "Thu hồi",
            AssetActionType.CREATE_ASSET,     "Cập nhật",
            AssetActionType.UPDATE_ASSET,     "Cập nhật",
            AssetActionType.CHANGE_CONDITION, "Cập nhật",
            AssetActionType.SOFT_DELETE,      "Cập nhật"
    );

    public AssetDto.Summary toSummary(Asset a) {
        return AssetDto.Summary.builder()
                .id(a.getAssetCode())
                .name(a.getAssetName())
                .desc(a.getDescription())
                .type(a.getAssetType())
                .status(STATUS_LABELS.getOrDefault(a.getStatus(), a.getStatus().name()))
                .statusColor(STATUS_COLORS.getOrDefault(a.getStatus(), "bg-gray-100 text-gray-600"))
                .user(resolveUser(a))
                .build();
    }

    public AssetDto.Detail toDetail(Asset a, List<AssetHistory> recentHistory) {
        return AssetDto.Detail.builder()
                .name(a.getAssetName())
                .code(a.getAssetCode())
                .type(a.getAssetType())
                .value(formatVND(a.getAssetValue()))
                .purchaseDate(formatDate(a.getPurchaseDate()))
                .status(STATUS_LABELS_UPPER.getOrDefault(
                        a.getStatus(), a.getStatus().name()))
                .condition(CONDITION_LABELS.getOrDefault(
                        a.getCondition(), a.getCondition().name()))
                .warranty(formatDate(a.getWarrantyUntil()))
                .supplier(a.getSupplierName())
                .contract(a.getContractNumber())
                .location(resolveUser(a))
                .description(a.getDescription())
                .imageUrl(a.getImageUrl())
                .recentHistory(recentHistory.stream()
                        .map(this::toHistoryItemDetail)
                        .collect(Collectors.toList()))
                .build();
    }

    public AssetDto.HistoryItem toHistoryItem(AssetHistory h) {
        return buildHistoryItem(h, DATETIME_FMT);
    }

    public AssetDto.HistoryItem toHistoryItemDetail(AssetHistory h) {
        return buildHistoryItem(h, DETAIL_DT_FMT);
    }

    private AssetDto.HistoryItem buildHistoryItem(AssetHistory h, DateTimeFormatter fmt) {
        return AssetDto.HistoryItem.builder()
                .id(h.getId())
                .type(HISTORY_TYPE.getOrDefault(h.getActionType(), "update"))
                .action(ACTION_LABELS.getOrDefault(h.getActionType(), "Cập nhật"))
                .user(h.getActorUsername())
                .description(h.getDetail())
                .date(h.getCreatedAt() != null ? h.getCreatedAt().format(fmt) : null)
                .build();
    }

    private String resolveUser(Asset a) {
        if (a.getAssignedTo() != null) {
            Employee emp = a.getAssignedTo();
            String fullName = ((emp.getFirstName() != null ? emp.getFirstName() : "") + " "
                    + (emp.getLastName() != null ? emp.getLastName() : "")).trim();
            return fullName.isEmpty() ? a.getLocation() : fullName;
        }
        return a.getLocation();
    }

    private String formatVND(BigDecimal value) {
        if (value == null) return null;
        long longVal = value.longValue();
        String formatted = String.format("%,d", longVal).replace(",", ",");
        return formatted + " VNĐ";
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FMT) : null;
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.format(DATETIME_FMT) : null;
    }
}