package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.OfficeLocationRequest;
import com.company.ems.backend.attendance.dto.OfficeLocationResponse;
import com.company.ems.backend.attendance.entity.OfficeLocation;
import com.company.ems.backend.attendance.repository.OfficeLocationRepository;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OfficeLocationServiceImpl implements OfficeLocationService {

    private final OfficeLocationRepository locationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OfficeLocationResponse> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfficeLocationResponse> getActiveLocations() {
        return locationRepository.findByIsActiveTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OfficeLocationResponse getLocationById(Long id) {
        OfficeLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OfficeLocation", "id", id));
        return mapToResponse(location);
    }

    @Override
    public OfficeLocationResponse createLocation(OfficeLocationRequest request, String updatedBy) {
        OfficeLocation location = OfficeLocation.builder()
                .name(request.getName())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusMeters(request.getRadiusMeters())
                .address(request.getAddress())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .updatedBy(updatedBy)
                .build();
        
        OfficeLocation saved = locationRepository.save(location);
        log.info("Created new office location: {} (id={}) by {}", saved.getName(), saved.getId(), updatedBy);
        return mapToResponse(saved);
    }

    @Override
    public OfficeLocationResponse updateLocation(Long id, OfficeLocationRequest request, String updatedBy) {
        OfficeLocation location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OfficeLocation", "id", id));
        
        location.setName(request.getName());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setRadiusMeters(request.getRadiusMeters());
        location.setAddress(request.getAddress());
        if (request.getIsActive() != null) {
            location.setIsActive(request.getIsActive());
        }
        location.setUpdatedBy(updatedBy);
        
        OfficeLocation updated = locationRepository.save(location);
        log.info("Updated office location: {} (id={}) by {}", updated.getName(), updated.getId(), updatedBy);
        return mapToResponse(updated);
    }

    @Override
    public void deleteLocation(Long id) {
        if (!locationRepository.existsById(id)) {
            throw new ResourceNotFoundException("OfficeLocation", "id", id);
        }
        locationRepository.deleteById(id);
        log.info("Deleted office location id={}", id);
    }

    private OfficeLocationResponse mapToResponse(OfficeLocation location) {
        return OfficeLocationResponse.builder()
                .id(location.getId())
                .name(location.getName())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .radiusMeters(location.getRadiusMeters())
                .address(location.getAddress())
                .isActive(location.getIsActive())
                .updatedAt(location.getUpdatedAt())
                .updatedBy(location.getUpdatedBy())
                .build();
    }
}
