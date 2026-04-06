package com.company.ems.backend.attendance.service;

import com.company.ems.backend.attendance.dto.OfficeLocationRequest;
import com.company.ems.backend.attendance.dto.OfficeLocationResponse;

import java.util.List;

public interface OfficeLocationService {
    List<OfficeLocationResponse> getAllLocations();
    List<OfficeLocationResponse> getActiveLocations();
    OfficeLocationResponse getLocationById(Long id);
    OfficeLocationResponse createLocation(OfficeLocationRequest request, String updatedBy);
    OfficeLocationResponse updateLocation(Long id, OfficeLocationRequest request, String updatedBy);
    void deleteLocation(Long id);
}
