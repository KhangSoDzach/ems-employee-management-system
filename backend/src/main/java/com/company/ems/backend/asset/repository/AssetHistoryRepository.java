package com.company.ems.backend.asset.repository;

import com.company.ems.backend.asset.entity.AssetHistory;
import com.company.ems.backend.asset.enums.AssetActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssetHistoryRepository extends JpaRepository<AssetHistory, Long> {
    @Query("""
                SELECT h
                FROM AssetHistory h
                WHERE (:assetId IS NULL OR h.asset.id = :assetId)
                AND (:actionTypes IS NULL OR h.actionType IN :actionTypes)
            """)
    Page<AssetHistory> findFiltered(
            @Param("assetId") Long assetId,
            @Param("actionTypes") List<AssetActionType> actionTypes,
            Pageable pageable);

    Page<AssetHistory> findByAssetId(
            @Param("assetId") Long assetId,
            Pageable pageable);

    @Override
    default void delete(@NonNull AssetHistory e) {
        throw new UnsupportedOperationException();
    }

    @Override
    default void deleteById(@NonNull Long id) {
        throw new UnsupportedOperationException();
    }

    @Override
    default void deleteAll() {
        throw new UnsupportedOperationException();
    }
}