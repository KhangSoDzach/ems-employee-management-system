package com.company.ems.backend.asset.service;

import com.company.ems.backend.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class AssetCodeGenerator {

    private final AssetRepository assetRepo;

    public String nextCode() {
        int year = LocalDate.now().getYear();
        String prefix = "ASSET-" + year + "-";

        long count = assetRepo.countByAssetCodeStartingWith(prefix);
        int seq = (int) count + 1;

        for (int attempt = 0; attempt < 10; attempt++) {
            String code = String.format("ASSET-%d-%04d", year, seq + attempt);
            if (!assetRepo.existsByAssetCode(code)) {
                return code;
            }
        }
        return String.format("ASSET-%d-%d", year, System.currentTimeMillis() % 100000);
    }
}