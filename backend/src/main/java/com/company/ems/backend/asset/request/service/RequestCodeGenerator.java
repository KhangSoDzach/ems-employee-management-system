package com.company.ems.backend.asset.request.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.ems.backend.asset.request.repository.AssetRequestRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RequestCodeGenerator {

    private final AssetRequestRepository requestRepo;

    @Transactional
    public String nextCode() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String prefix = "ARQ" + datePrefix;

        long count = requestRepo.count();
        return String.format("%s-%03d", prefix, count + 1);
    }
}
