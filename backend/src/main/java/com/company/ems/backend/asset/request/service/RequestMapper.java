package com.company.ems.backend.asset.request.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

import com.company.ems.backend.asset.request.dto.AssetRequestDto;
import com.company.ems.backend.asset.request.entity.AssetRequest;
import com.company.ems.backend.asset.request.enums.AssetRequestStatus;
import com.company.ems.backend.asset.request.enums.RequestPriority;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RequestMapper {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public AssetRequestDto.RequestRow toRow(AssetRequest request) {
        return AssetRequestDto.RequestRow.builder()
                .id(request.getId())
                .requestId(request.getRequestCode())
                .assetType(request.getAssetType())
                .priority(request.getPriority().name())
                .priorityLabel(toPriorityLabel(request.getPriority()))
                .priorityColor(toPriorityColor(request.getPriority()))
                .dateRequested(formatDate(request.getCreatedAt()))
                .status(request.getStatus().name())
                .statusLabel(toStatusLabel(request.getStatus()))
                .statusColor(toStatusColor(request.getStatus()))
                .build();
    }

    public AssetRequestDto.RequestDetail toDetail(AssetRequest request) {
        return AssetRequestDto.RequestDetail.builder()
                .id(request.getId())
                .requestId(request.getRequestCode())
                .assetType(request.getAssetType())
                .priority(request.getPriority().name())
                .priorityLabel(toPriorityLabel(request.getPriority()))
                .priorityColor(toPriorityColor(request.getPriority()))
                .reason(request.getReason())
                .status(request.getStatus().name())
                .statusLabel(toStatusLabel(request.getStatus()))
                .statusColor(toStatusColor(request.getStatus()))
                .requestedBy(request.getRequestedBy() != null ? request.getRequestedBy().getFirstName() + " " + request.getRequestedBy().getLastName() : null)
                .requestedAt(formatDate(request.getCreatedAt()))
                .reviewedBy(request.getReviewedBy() != null ? request.getReviewedBy().getUsername() : null)
                .reviewedAt(formatDate(request.getReviewedAt()))
                .reviewNote(request.getReviewNote())
                .requesterUserId(request.getRequestedBy() != null && request.getRequestedBy().getUser() != null ? request.getRequestedBy().getUser().getId() : null)
                .build();
    }

    public AssetRequestDto.AdminListItem toAdminItem(AssetRequest request) {
        return AssetRequestDto.AdminListItem.builder()
                .id(request.getId())
                .requestId(request.getRequestCode())
                .employeeName(request.getRequestedBy() != null ? request.getRequestedBy().getFirstName() + " " + request.getRequestedBy().getLastName() : "Unknown")
                .assetType(request.getAssetType())
                .priority(request.getPriority().name())
                .priorityLabel(toPriorityLabel(request.getPriority()))
                .priorityColor(toPriorityColor(request.getPriority()))
                .requestedAt(formatDate(request.getCreatedAt()))
                .status(request.getStatus().name())
                .statusLabel(toStatusLabel(request.getStatus()))
                .statusColor(toStatusColor(request.getStatus()))
                .requesterUserId(request.getRequestedBy() != null && request.getRequestedBy().getUser() != null ? request.getRequestedBy().getUser().getId() : null)
                .build();
    }

    private String toStatusLabel(AssetRequestStatus status) {
        return switch (status) {
            case PENDING -> "Chờ duyệt";
            case APPROVED -> "Đã duyệt";
            case REJECTED -> "Từ chối";
            case CANCELLED -> "Đã hủy";
        };
    }

    private String toStatusColor(AssetRequestStatus status) {
        return switch (status) {
            case PENDING -> "bg-yellow-100 text-yellow-700";
            case APPROVED -> "bg-green-100 text-green-700";
            case REJECTED, CANCELLED -> "bg-red-100 text-red-700";
        };
    }

    private String toPriorityLabel(RequestPriority priority) {
        return switch (priority) {
            case LOW -> "Thấp";
            case NORMAL -> "Bình thường";
            case HIGH -> "Cao";
            case URGENT -> "Khẩn cấp";
        };
    }

    private String toPriorityColor(RequestPriority priority) {
        return switch (priority) {
            case LOW -> "bg-gray-100 text-gray-700";
            case NORMAL -> "bg-blue-100 text-blue-700";
            case HIGH -> "bg-orange-100 text-orange-700";
            case URGENT -> "bg-red-100 text-red-700";
        };
    }

    private String formatDate(LocalDateTime date) {
        return date != null ? date.format(DATE_FMT) : null;
    }
}
