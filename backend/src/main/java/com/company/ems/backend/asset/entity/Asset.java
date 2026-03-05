package com.company.ems.backend.asset.entity;

import com.company.ems.backend.asset.enums.AssetCondition;
import com.company.ems.backend.asset.enums.AssetStatus;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@Where(clause = "deleted = false")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "asset_code", nullable = false, unique = true, length = 20)
    private String assetCode;
    @Column(name = "asset_name", nullable = false, length = 255)
    private String assetName;
    @Column(name = "asset_type", length = 50)
    private String assetType;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "asset_value", precision = 18, scale = 2)
    private BigDecimal assetValue;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AssetStatus status = AssetStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_condition", nullable = false, length = 20)
    private AssetCondition condition = AssetCondition.NEW;
    @Column(name = "location", length = 255)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private Employee assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_id")
    private User assignedBy;

    @Column(name = "assigned_date")
    private LocalDateTime assignedDate;

    @Column(name = "return_date")
    private LocalDateTime returnDate;
    @Column(name = "warranty_until")
    private LocalDate warrantyUntil;

    @Column(name = "supplier_name", length = 255)
    private String supplierName;
    @Column(name = "contract_until")
    private LocalDate contractUntil;
    @Column(name = "contract_number", length = 100)
    private String contractNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;
}