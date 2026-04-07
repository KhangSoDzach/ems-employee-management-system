package com.company.ems.backend.asset.incident.service;

import com.company.ems.backend.asset.incident.repository.AssetIncidentReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
@Component
@RequiredArgsConstructor
public class IncidentCodeGenerator {

    private final AssetIncidentReportRepository repo;

    public String nextCode() {
        int year = LocalDate.now().getYear();
        String prefix = "REP-" + year + "-";
        long count = repo.countByReportCodeStartingWith(prefix);
        int seq = (int) count + 1;

        for (int attempt = 0; attempt < 10; attempt++) {
            String code = String.format("REP-%d-%03d", year, seq + attempt);
            if (!repo.existsByReportCode(code)) {
                return code;
            }
        }
        return String.format("REP-%d-%d", year, System.currentTimeMillis() % 100000);
    }
}