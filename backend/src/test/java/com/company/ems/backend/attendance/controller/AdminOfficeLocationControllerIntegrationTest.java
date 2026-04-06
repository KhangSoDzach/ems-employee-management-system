package com.company.ems.backend.attendance.controller;

import com.company.ems.backend.attendance.dto.OfficeLocationRequest;
import com.company.ems.backend.attendance.entity.OfficeLocation;
import com.company.ems.backend.attendance.repository.OfficeLocationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminOfficeLocationController – Integration Tests")
class AdminOfficeLocationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OfficeLocationRepository locationRepository;

    @Autowired
    private ObjectMapper objectMapper;

        @MockitoBean
    private com.company.ems.backend.rbac.service.DataScopeService dataScopeService;

    @BeforeEach
    void setUp() {
        locationRepository.deleteAll();

        // Standard mock principal for tests
        com.company.ems.backend.auth.security.CustomUserPrincipal mockPrincipal = 
            org.mockito.Mockito.mock(com.company.ems.backend.auth.security.CustomUserPrincipal.class);
        org.mockito.Mockito.when(mockPrincipal.getUsername()).thenReturn("admin");
        org.mockito.Mockito.when(dataScopeService.getCurrentPrincipal()).thenReturn(mockPrincipal);
    }

    @Test
    @WithMockUser(authorities = "SYSTEM_CONFIG_MANAGE")
    @DisplayName("POST /api/v1/admin/office-locations – Create new location")
    void createLocation() throws Exception {
        OfficeLocationRequest request = OfficeLocationRequest.builder()
                .name("New Office")
                .latitude(10.0)
                .longitude(100.0)
                .radiusMeters(50.0)
                .address("Test Address")
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/admin/office-locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New Office"));

        assertThat(locationRepository.findAll()).hasSize(1);
    }

    @Test
    @WithMockUser(authorities = "SYSTEM_CONFIG_MANAGE")
    @DisplayName("GET /api/v1/admin/office-locations – List all locations")
    void getAllLocations() throws Exception {
        locationRepository.save(OfficeLocation.builder().name("Loc 1").latitude(1.0).longitude(1.0).radiusMeters(10.0).isActive(true).build());
        locationRepository.save(OfficeLocation.builder().name("Loc 2").latitude(2.0).longitude(2.0).radiusMeters(20.0).isActive(false).build());

        mockMvc.perform(get("/api/v1/admin/office-locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @WithMockUser(authorities = "SYSTEM_CONFIG_MANAGE")
    @DisplayName("PUT /api/v1/admin/office-locations/{id} – Update location")
    void updateLocation() throws Exception {
        OfficeLocation saved = locationRepository.save(OfficeLocation.builder()
                .name("Old Name")
                .latitude(1.0)
                .longitude(1.0)
                .radiusMeters(10.0)
                .isActive(true)
                .build());

        OfficeLocationRequest request = OfficeLocationRequest.builder()
                .name("Updated Name")
                .latitude(1.1)
                .longitude(1.1)
                .radiusMeters(15.0)
                .isActive(false)
                .build();

        mockMvc.perform(put("/api/v1/admin/office-locations/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Name"));

        OfficeLocation updated = locationRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getIsActive()).isFalse();
    }

    @Test
    @WithMockUser(authorities = "SYSTEM_CONFIG_MANAGE")
    @DisplayName("DELETE /api/v1/admin/office-locations/{id} – Delete location")
    void deleteLocation() throws Exception {
        OfficeLocation saved = locationRepository.save(OfficeLocation.builder()
                .name("To Delete")
                .latitude(1.0)
                .longitude(1.0)
                .radiusMeters(10.0)
                .isActive(true)
                .build());

        mockMvc.perform(delete("/api/v1/admin/office-locations/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(locationRepository.existsById(saved.getId())).isFalse();
    }

    @Test
    @WithMockUser(authorities = "NOT_AN_ADMIN")
    @DisplayName("Forbidden if user lacking authority")
    void forbiddenWhenLackingAuthority() throws Exception {
        mockMvc.perform(get("/api/v1/admin/office-locations"))
                .andExpect(status().isForbidden());
    }
}
