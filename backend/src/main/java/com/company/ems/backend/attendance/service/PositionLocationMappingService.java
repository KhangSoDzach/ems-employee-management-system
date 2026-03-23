package com.company.ems.backend.attendance.service;

import java.util.List;

import com.company.ems.backend.attendance.dto.PositionLocationMappingRequest;
import com.company.ems.backend.attendance.dto.PositionLocationMappingResponse;

public interface PositionLocationMappingService {
    List<PositionLocationMappingResponse> getAllMappings();

    PositionLocationMappingResponse updateMapping(Long positionId, PositionLocationMappingRequest request);
}
