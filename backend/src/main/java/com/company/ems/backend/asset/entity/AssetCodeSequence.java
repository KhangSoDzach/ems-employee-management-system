package com.company.ems.backend.asset.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "asset_code_sequence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssetCodeSequence {

    @Id
    @Column(name = "year_part")
    private Short yearPart;

    @Column(name = "next_seq", nullable = false)
    private Integer nextSeq = 1;
}