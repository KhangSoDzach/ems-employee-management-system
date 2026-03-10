package com.company.ems.backend.position.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.position.dto.PositionResponse;
import com.company.ems.backend.position.repository.PositionRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/positions")
@RequiredArgsConstructor
@Tag(name = "Position Management", description = "APIs for managing job positions")
public class PositionController {

        private final PositionRepository positionRepository;

        @GetMapping
        @Operation(summary = "Get all active positions, optionally filtered by departmentId")
        public ResponseEntity<ApiResponse<List<PositionResponse>>> getAllPositions(
                        @RequestParam(required = false) Long departmentId) {

                List<PositionResponse> positions;

                if (departmentId != null) {
                        // Filtered by department - uses JOIN FETCH to avoid LazyInitializationException
                        positions = positionRepository.findAllActiveByDepartmentId(departmentId).stream()
                                        .map(p -> PositionResponse.builder()
                                                        .id(p.getId())
                                                        .title(p.getTitle())
                                                        .code(p.getCode())
                                                        .departmentId(p.getDepartment().getId())
                                                        .level(p.getLevel())
                                                        .build())
                                        .collect(Collectors.toList());
                } else {
                        // All active positions - uses JOIN FETCH
                        positions = positionRepository.findAllActiveWithDepartment().stream()
                                        .map(p -> PositionResponse.builder()
                                                        .id(p.getId())
                                                        .title(p.getTitle())
                                                        .code(p.getCode())
                                                        .departmentId(p.getDepartment().getId())
                                                        .level(p.getLevel())
                                                        .build())
                                        .collect(Collectors.toList());
                }

                return ResponseEntity.ok(ApiResponse.success("Success", positions));
        }
}
