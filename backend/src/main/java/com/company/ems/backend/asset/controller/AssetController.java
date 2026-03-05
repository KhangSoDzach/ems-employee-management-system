package com.company.ems.backend.asset.controller;

import com.company.ems.backend.asset.dto.AssetDto;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.asset.service.AssetService;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;
    @GetMapping("/next-code")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto.CodePreview>> nextCode() {
        return ResponseEntity.ok(ApiResponse.success(
                "Preview mã tài sản", assetService.previewNextCode()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AssetDto.Summary>>> listAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false)   AssetStatus status,
            @RequestParam(required = false)   String type,
            @RequestParam(required = false)   String keyword) {

        return ResponseEntity.ok(ApiResponse.success("Danh sách tài sản",
                assetService.listAssets(page, size, status, type, keyword)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto.Detail>> getAsset(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Chi tiết tài sản",
                assetService.getAssetById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto.Detail>> createAsset(
            @Valid @RequestBody AssetDto.CreateRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài sản thành công",
                        assetService.createAsset(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto.Detail>> updateAsset(
            @PathVariable Long id,
            @Valid @RequestBody AssetDto.UpdateRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Cập nhật tài sản thành công",
                assetService.updateAsset(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài sản thành công", null));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto.Detail>> assignAsset(
            @PathVariable Long id,
            @Valid @RequestBody AssetDto.AssignRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Cấp phát tài sản thành công",
                assetService.assignAsset(id, request)));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<ApiResponse<AssetDto.Detail>> returnAsset(
            @PathVariable Long id,
            @Valid @RequestBody AssetDto.ReturnRequest request) {

        return ResponseEntity.ok(ApiResponse.success("Thu hồi tài sản thành công",
                assetService.returnAsset(id, request)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','HR','ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<AssetDto.HistoryItem>>> getHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "all") String historyType,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size) {

        return ResponseEntity.ok(ApiResponse.success("Lịch sử tài sản",
                assetService.getHistory(id, historyType, page, size)));
    }

    @GetMapping("/{id}/history/export")
    @PreAuthorize("hasAnyRole('HR','ADMIN')")
    public ResponseEntity<byte[]> exportHistory(@PathVariable Long id) {
        byte[] csv      = assetService.exportHistoryCsv(id);
        String filename = "lich-su-tai-san-" + id + "-" + LocalDate.now() + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok().headers(headers).body(csv);
    }
}