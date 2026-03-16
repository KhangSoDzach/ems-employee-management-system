package com.company.ems.backend.asset.mapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.company.ems.backend.asset.dto.AssetDto;
import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.entity.AssetHistory;
import com.company.ems.backend.asset.enums.AssetActionType;
import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.entity.Employee;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AssetMapper {

    private final MessageService messages;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DETAIL_DT_FMT = DateTimeFormatter.ofPattern("HH:mm, dd/MM/yyyy");

    private String statusLabel(AssetStatus s) {
        return switch (s) {
            case AVAILABLE -> messages.get(MessageCode.ASSET_STATUS_AVAILABLE);
            case ASSIGNED -> messages.get(MessageCode.ASSET_STATUS_ASSIGNED);
            case RETIRED -> messages.get(MessageCode.ASSET_STATUS_RETIRED);
        };
    }

    private String statusLabelUpper(AssetStatus s) {
        return switch (s) {
            case AVAILABLE -> messages.get(MessageCode.ASSET_STATUS_AVAILABLE_UPPER);
            case ASSIGNED -> messages.get(MessageCode.ASSET_STATUS_ASSIGNED_UPPER);
            case RETIRED -> messages.get(MessageCode.ASSET_STATUS_RETIRED_UPPER);
        };
    }

    private static final Map<AssetStatus, String> STATUS_COLORS = Map.of(
            AssetStatus.AVAILABLE, "bg-green-100 text-green-700",
            AssetStatus.ASSIGNED, "bg-blue-100 text-blue-700",
            AssetStatus.RETIRED, "bg-yellow-100 text-yellow-700");

    public String conditionLabel(AssetCondition c) {
        return switch (c) {
            case NEW -> messages.get(MessageCode.ASSET_CONDITION_NEW);
            case GOOD -> messages.get(MessageCode.ASSET_CONDITION_GOOD);
            case DAMAGED -> messages.get(MessageCode.ASSET_CONDITION_DAMAGED);
            case LOST -> messages.get(MessageCode.ASSET_CONDITION_LOST);
            case DISPOSED -> messages.get(MessageCode.ASSET_CONDITION_DISPOSED);
        };
    }

    public String actionLabel(AssetActionType t) {
        return switch (t) {
            case ASSIGN_ASSET -> messages.get(MessageCode.ASSET_ACTION_ASSIGN);
            case CHANGE_STATUS -> null;
            case RETURN_ASSET, RETIRE_ASSET -> messages.get(MessageCode.ASSET_ACTION_RETURN);
            case CREATE_ASSET, UPDATE_ASSET,
                 CHANGE_CONDITION, SOFT_DELETE ->
                    messages.get(MessageCode.ASSET_ACTION_UPDATE);
        };
    }

    private static String historyType(AssetActionType t) {
        return switch (t) {
            case ASSIGN_ASSET -> "assign";
            case CHANGE_STATUS -> null;
            case RETURN_ASSET, RETIRE_ASSET -> "return";
            case CREATE_ASSET, UPDATE_ASSET,
                 CHANGE_CONDITION, SOFT_DELETE ->
                    "update";
        };
    }

    public AssetDto.Summary toSummary(Asset a) {
        return AssetDto.Summary.builder()
                .dbId(a.getId())
                .id(a.getAssetCode())
                .name(a.getAssetName())
                .desc(a.getDescription())
                .type(a.getAssetType())
                .status(statusLabel(a.getStatus()))
                .statusColor(STATUS_COLORS.getOrDefault(a.getStatus(), "bg-gray-100 text-gray-600"))
                .user(resolveUser(a))
                .build();
    }

    public AssetDto.Detail toDetail(Asset a, List<AssetHistory> recentHistory) {
        return AssetDto.Detail.builder()
                .id(a.getId())
                .name(a.getAssetName())
                .code(a.getAssetCode())
                .type(a.getAssetType())
                .value(formatVND(a.getAssetValue()))
                .purchaseDate(formatDate(a.getPurchaseDate()))
                .status(statusLabelUpper(a.getStatus()))
                .condition(conditionLabel(a.getCondition()))
                .warranty(formatDate(a.getWarrantyUntil()))
                .supplier(a.getSupplierName())
                .contract(a.getContractNumber())
                .location(resolveUser(a))
                .description(a.getDescription())
                .notes(a.getNotes())
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
                .type(historyType(h.getActionType()))
                .action(actionLabel(h.getActionType()))
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
        if (value == null)
            return null;
        return String.format("%,d VND", value.longValue());
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FMT) : null;
    }

}