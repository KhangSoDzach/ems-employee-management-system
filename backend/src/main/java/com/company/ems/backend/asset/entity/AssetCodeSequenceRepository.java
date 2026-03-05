package com.company.ems.backend.asset.entity;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AssetCodeSequenceRepository extends JpaRepository<AssetCodeSequence, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AssetCodeSequence s WHERE s.yearPart = :year")
    Optional<AssetCodeSequence> findByYearForUpdate(@Param("year") Short year);
}
