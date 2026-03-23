package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.PositionLocationMappingRequest;
import com.company.ems.backend.attendance.dto.PositionLocationMappingResponse;
import com.company.ems.backend.attendance.entity.OfficeLocation;
import com.company.ems.backend.attendance.repository.OfficeLocationRepository;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.position.entity.Position;
import com.company.ems.backend.position.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PositionLocationMappingServiceImpl implements PositionLocationMappingService {

    private final PositionRepository positionRepository;
    private final OfficeLocationRepository officeLocationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PositionLocationMappingResponse> getAllMappings() {
        return positionRepository.findAllActiveWithDepartment().stream()
                .map(this::mapResponse)
                .toList();
    }

    @Override
    public PositionLocationMappingResponse updateMapping(Long positionId, PositionLocationMappingRequest request) {
        Position position = positionRepository.findById(positionId)
                .orElseThrow(() -> new ResourceNotFoundException("Position", "id", positionId));

        OfficeLocation officeLocation = officeLocationRepository.findById(request.getOfficeLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("OfficeLocation", "id", request.getOfficeLocationId()));

        position.setOfficeLocation(officeLocation);
        Position updated = positionRepository.save(position);
        return mapResponse(updated);
    }

    private PositionLocationMappingResponse mapResponse(Position position) {
        OfficeLocation officeLocation = position.getOfficeLocation();
        return PositionLocationMappingResponse.builder()
                .positionId(position.getId())
                .positionCode(position.getCode())
                .positionTitle(position.getTitle())
                .departmentId(position.getDepartment() != null ? position.getDepartment().getId() : null)
                .officeLocationId(officeLocation != null ? officeLocation.getId() : null)
                .officeLocationName(officeLocation != null ? officeLocation.getName() : null)
                .officeLocationActive(officeLocation != null ? officeLocation.getIsActive() : null)
                .build();
    }
}
