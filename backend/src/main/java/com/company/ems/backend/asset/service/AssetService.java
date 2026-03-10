package com.company.ems.backend.asset.service;

import com.company.ems.backend.asset.dto.AssetDto;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.common.dto.PageResponse;

public interface AssetService {
    AssetDto.CodePreview previewNextCode();

    PageResponse<AssetDto.Summary> listAssets(int page, int size, AssetStatus status, String type, String keyword);

    AssetDto.Detail getAssetById(Long id);

    AssetDto.Detail createAsset(AssetDto.CreateRequest request);

    AssetDto.Detail updateAsset(Long id, AssetDto.UpdateRequest request);

    void deleteAsset(Long id);

    AssetDto.Detail assignAsset(Long assetId, AssetDto.AssignRequest request);

    AssetDto.Detail returnAsset(Long assetId, AssetDto.ReturnRequest request);

    PageResponse<AssetDto.HistoryItem> getHistory(Long assetId, String historyType, int page, int size);

    byte[] exportHistoryCsv(Long assetId);

    byte[] exportAssetsCsv(AssetStatus status, String type, String keyword);
}