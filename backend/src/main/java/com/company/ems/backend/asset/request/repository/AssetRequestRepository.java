package com.company.ems.backend.asset.request.repository;

import com.company.ems.backend.asset.request.entity.AssetRequest;
import com.company.ems.backend.asset.request.enums.AssetRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AssetRequestRepository extends JpaRepository<AssetRequest, Long> {

    @Query("SELECT r FROM AssetRequest r LEFT JOIN FETCH r.requestedBy LEFT JOIN FETCH r.reviewedBy WHERE r.id = :id")
    java.util.Optional<AssetRequest> findByIdWithDetails(@Param("id") Long id);

    Page<AssetRequest> findByRequestedBy_Id(Long employeeId, Pageable pageable);

    @Query("SELECT r FROM AssetRequest r " +
            "WHERE (:status IS NULL OR r.status = :status) " +
            "AND (:employeeId IS NULL OR r.requestedBy.id = :employeeId) " +
            "AND (CAST(:fromDate AS timestamp) IS NULL OR r.createdAt >= :fromDate) " +
            "AND (CAST(:toDate AS timestamp) IS NULL OR r.createdAt <= :toDate) " +
            "AND (:keyword IS NULL OR " +
            "    LOWER(r.requestCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(r.requestedBy.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(r.requestedBy.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(r.assetType) LIKE LOWER(CONCAT('%', :keyword, '%')) )")
    Page<AssetRequest> findAllFiltered(
            @Param("status") AssetRequestStatus status,
            @Param("employeeId") Long employeeId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("keyword") String keyword,
            Pageable pageable);
}
