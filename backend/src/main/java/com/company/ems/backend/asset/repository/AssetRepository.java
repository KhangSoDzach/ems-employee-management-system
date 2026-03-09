package com.company.ems.backend.asset.repository;

import com.company.ems.backend.asset.entity.Asset;
import com.company.ems.backend.asset.enums.AssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    @Query("SELECT a FROM Asset a WHERE a.id = :id AND a.deleted = false")
    Optional<Asset> findActiveById(@Param("id") Long id);

    @Query("""
            SELECT a FROM Asset a
            WHERE a.deleted = false
              AND (:status IS NULL OR a.status = :status)
              AND (:assetType IS NULL OR a.assetType = :assetType)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(a.assetName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(a.assetCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<Asset> findFiltered(
            @Param("status") AssetStatus status,
            @Param("assetType") String assetType,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("""
            SELECT a FROM Asset a
            WHERE a.deleted = false
              AND (:status IS NULL OR a.status = :status)
              AND (:assetType IS NULL OR a.assetType = :assetType)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(a.assetName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(a.assetCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<Asset> searchAll(
            @Param("status") AssetStatus status,
            @Param("assetType") String assetType,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("""
        SELECT a FROM Asset a
        WHERE a.deleted = false
          AND (a.assignedTo IS NOT NULL AND a.assignedTo.department.id = :deptId)
          AND (:status IS NULL OR a.status = :status)
          AND (:assetType IS NULL OR a.assetType = :assetType)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(a.assetName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(a.assetCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<Asset> searchByDepartment(
            @Param("deptId") Long deptId,
            @Param("status") AssetStatus status,
            @Param("assetType") String assetType,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("""
            SELECT a FROM Asset a
            WHERE a.deleted = false
              AND a.assignedTo.id = :empId
              AND (:status IS NULL OR a.status = :status)
              AND (:assetType IS NULL OR a.assetType = :assetType)
              AND (:keyword IS NULL OR :keyword = ''
                   OR LOWER(a.assetName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(a.assetCode) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY a.createdAt DESC
            """)
    Page<Asset> searchByEmployee(
            @Param("empId") Long empId,
            @Param("status") AssetStatus status,
            @Param("assetType") String assetType,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT COUNT(a) FROM Asset a WHERE a.assetCode LIKE :prefix%")
    long countByAssetCodeStartingWith(@Param("prefix") String prefix);

    boolean existsByAssetCode(String assetCode);

    @Query("SELECT a FROM Asset a WHERE a.assignedTo.id = :empId AND a.deleted = false")
    java.util.List<Asset> findByAssignedToId(@Param("empId") Long empId);
}
