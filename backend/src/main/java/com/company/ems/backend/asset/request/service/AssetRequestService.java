package com.company.ems.backend.asset.request.service;

import com.company.ems.backend.asset.request.dto.AssetRequestDto;
import com.company.ems.backend.asset.request.enums.AssetRequestStatus;
import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;

public interface AssetRequestService {

    ApiResponse<AssetRequestDto.RequestDetail> submitRequest(
            AssetRequestDto.SubmitRequest requestDto,
            CustomUserPrincipal principal);

    PageResponse<AssetRequestDto.RequestRow> getMyRequests(
            int page, int size,
            CustomUserPrincipal principal);

    AssetRequestDto.RequestDetail getMyRequestDetail(Long id, CustomUserPrincipal principal);

    ApiResponse<AssetRequestDto.RequestDetail> cancelRequest(
            Long id,
            CustomUserPrincipal principal);

    PageResponse<AssetRequestDto.AdminListItem> getAllRequests(
            AssetRequestStatus status,
            Long employeeId,
            String fromDate,
            String toDate,
            String keyword,
            int page, int size);

    AssetRequestDto.RequestDetail getRequestDetail(Long id);

    ApiResponse<AssetRequestDto.RequestDetail> approveRequest(
            Long id,
            AssetRequestDto.ProcessRequest requestDto,
            CustomUserPrincipal principal);

    ApiResponse<AssetRequestDto.RequestDetail> rejectRequest(
            Long id,
            AssetRequestDto.ProcessRequest requestDto,
            CustomUserPrincipal principal);
}
