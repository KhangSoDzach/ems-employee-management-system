package com.company.ems.backend.asset.controller;

import java.time.LocalDate;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.asset.dto.AssetDto;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.asset.service.AssetService;
import com.company.ems.backend.common.constant.AppRole;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
// support both current (v1) and legacy (no version) endpoints to avoid 500 errors
@RequestMapping({"/api/v1/assets", "/api/assets"})
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;
    private final MessageService messages;

    @GetMapping("/next-code")
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<ApiResponse<AssetDto.CodePreview>> nextCode() {
        return ResponseEntity.ok(ApiResponse.success(
                messages.get(MessageCode.ASSET_CODE_PREVIEW), assetService.previewNextCode()));
    }

    @GetMapping
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<PageResponse<AssetDto.Summary>>> listAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {

        return ResponseEntity.ok(ApiResponse.success(assetService.listAssets(page, size, status, type, keyword)));
    }

    @GetMapping("/{idOrCode}")
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<AssetDto.Detail>> getAsset(@PathVariable String idOrCode) {
        Long resolvedId = assetService.resolveAssetId(idOrCode);
        return ResponseEntity.ok(ApiResponse.success(assetService.getAssetById(resolvedId)));
    }

    @PostMapping
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<ApiResponse<AssetDto.Detail>> createAsset(
            @Valid @RequestBody AssetDto.CreateRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(messages.get(MessageCode.ASSET_CREATED),
                        assetService.createAsset(request)));
    }

        @PutMapping("/{idOrCode}")
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<ApiResponse<AssetDto.Detail>> updateAsset(
            @PathVariable String idOrCode,
            @Valid @RequestBody AssetDto.UpdateRequest request) {

        Long resolvedId = assetService.resolveAssetId(idOrCode);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.ASSET_UPDATED),
            assetService.updateAsset(resolvedId, request)));
    }

        @DeleteMapping("/{idOrCode}")
    @PreAuthorize(AppRole.HAS_ADMIN_ONLY)
        public ResponseEntity<ApiResponse<Void>> deleteAsset(@PathVariable String idOrCode) {
        Long resolvedId = assetService.resolveAssetId(idOrCode);
        assetService.deleteAsset(resolvedId);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.ASSET_DELETED), null));
    }

        @PostMapping("/{idOrCode}/assign")
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<ApiResponse<AssetDto.Detail>> assignAsset(
            @PathVariable String idOrCode,
            @Valid @RequestBody AssetDto.AssignRequest request) {

        Long resolvedId = assetService.resolveAssetId(idOrCode);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.ASSET_ASSIGNED),
            assetService.assignAsset(resolvedId, request)));
    }

        @PostMapping("/{idOrCode}/return")
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<ApiResponse<AssetDto.Detail>> returnAsset(
            @PathVariable String idOrCode,
            @Valid @RequestBody AssetDto.ReturnRequest request) {

        Long resolvedId = assetService.resolveAssetId(idOrCode);
        return ResponseEntity.ok(ApiResponse.success(messages.get(MessageCode.ASSET_RETURNED),
            assetService.returnAsset(resolvedId, request)));
    }

        @GetMapping("/{idOrCode}/history")
    @PreAuthorize(AppRole.HAS_ANY)
    public ResponseEntity<ApiResponse<PageResponse<AssetDto.HistoryItem>>> getHistory(
            @PathVariable String idOrCode,
            @RequestParam(defaultValue = "all") String historyType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Long resolvedId = assetService.resolveAssetId(idOrCode);
        return ResponseEntity.ok(ApiResponse.success(
            assetService.getHistory(resolvedId, historyType, page, size)));
    }

    @GetMapping("/export")
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<byte[]> exportAssets(
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {

        byte[] csv = assetService.exportAssetsCsv(status, type, keyword);
        String filename = "danh-sach-tai-san-" + LocalDate.now() + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @GetMapping("/{idOrCode}/history/export")
    @PreAuthorize(AppRole.HAS_HR_OR_ADMIN)
    public ResponseEntity<byte[]> exportHistory(@PathVariable String idOrCode) {
        Long resolvedId = assetService.resolveAssetId(idOrCode);
        byte[] csv = assetService.exportHistoryCsv(resolvedId);
        String filename = "lich-su-tai-san-" + resolvedId + "-" + LocalDate.now() + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok().headers(headers).body(csv);
    }
}
