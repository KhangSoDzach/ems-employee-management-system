package com.company.ems.backend.asset.entity;

import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE assets SET is_deleted = true, deleted_at = NOW() WHERE id = ?")
@Where(clause = "is_deleted = false")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_code", unique = true, nullable = false, length = 50)
    private String assetCode;

    @Column(name = "asset_name", nullable = false)
    private String assetName;

    @Column(name = "asset_type", nullable = false, length = 50)
    private String assetType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 15, scale = 2)
    private BigDecimal purchasePrice;

    @Column(length = 255)
    private String supplier;

    @Column(name = "warranty_until")
    private LocalDate warrantyUntil;

    @Column(columnDefinition = "JSON")
    private String specifications;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_condition", nullable = false, length = 20)
    private AssetCondition assetCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_status", nullable = false, length = 20)
    private AssetStatus assetStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_employee_id")
    private Employee assignedToEmployee;

    @Column(name = "assigned_date")
    private LocalDateTime assignedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_user_id")
    private User assignedByUser;

    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Column(length = 255)
    private String location;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by_user_id")
    private User deletedByUser;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", updatable = false)
    private User createdByUser;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_user_id")
    private User updatedByUser;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (assetCondition == null) {
            assetCondition = AssetCondition.NEW;
        }
        if (assetStatus == null) {
            assetStatus = AssetStatus.AVAILABLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean isAvailable() {
        return assetStatus == AssetStatus.AVAILABLE && !isDeleted;
    }

    public boolean isAssigned() {
        return assetStatus == AssetStatus.ASSIGNED && assignedToEmployee != null;
    }

    public boolean canBeAssigned() {
        return isAvailable() && assetCondition != AssetCondition.LOST
                && assetCondition != AssetCondition.DISPOSED;
    }

    public boolean canBeReturned() {
        return isAssigned();
    }
}