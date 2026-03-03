package com.company.ems.backend.employee.controller;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.dto.EmployeeProfileResponse;
import com.company.ems.backend.employee.service.EmployeeProfileService;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmployeeProfileController.class)
@DisplayName("EmployeeProfileController — Integration Tests")
class EmployeeProfileControllerTest {

    @Autowired MockMvc mockMvc;

    @MockBean EmployeeProfileService profileService;
    @MockBean DataScopeService       dataScopeService;

    static final Long MANAGER_USER_ID   = 2L;
    static final Long EMPLOYEE1_USER_ID = 3L;
    static final Long EMPLOYEE1_EMP_ID  = 11L;
    static final Long EMPLOYEE2_EMP_ID  = 12L;
    static final Long HR_USER_ID        = 1L;

    final EmployeeProfileResponse sampleProfile = EmployeeProfileResponse.builder()
            .id(EMPLOYEE1_EMP_ID)
            .employeeCode("EMP-011")
            .fullName("Tran Employee1")
            .email("employee1@ems.company.com")
            .phone("0922222222")
            .departmentName("Engineering")
            .positionTitle("Software Engineer")
            .hireDate(LocalDate.of(2022, 3, 15))
            .status("ACTIVE")
            .build();

    private CustomUserPrincipal employeePrincipal() {
        return new CustomUserPrincipal(
                EMPLOYEE1_USER_ID, "employee1", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.SELF));
    }

    private CustomUserPrincipal managerPrincipal() {
        return new CustomUserPrincipal(
                MANAGER_USER_ID, "manager1", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.TEAM, DataScope.SELF));
    }

    private CustomUserPrincipal hrPrincipal() {
        return new CustomUserPrincipal(
                HR_USER_ID, "hr_admin", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.ALL));
    }

    @Nested
    @DisplayName("GET /api/v1/profile — Xem hồ sơ của mình")
    class GetMyProfile {

        @Test
        @DisplayName("Employee đăng nhập → 200 trả về profile")
        void employee_getsOwnProfile_200() throws Exception {
            when(profileService.getMyProfile()).thenReturn(sampleProfile);

            mockMvc.perform(get("/api/v1/profile")
                            .with(SecurityMockMvcRequestPostProcessors.user(employeePrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(EMPLOYEE1_EMP_ID))
                    .andExpect(jsonPath("$.data.fullName").value("Tran Employee1"))
                    .andExpect(jsonPath("$.data.email").value("employee1@ems.company.com"))
                    .andExpect(jsonPath("$.data.salary").doesNotExist())
                    .andExpect(jsonPath("$.data.bankAccountNumber").doesNotExist())
                    .andExpect(jsonPath("$.data.nationalId").doesNotExist());
        }

        @Test
        @DisplayName("Không có token → 401 Unauthorized")
        void noToken_401() throws Exception {
            mockMvc.perform(get("/api/v1/profile"))
                    .andExpect(status().isUnauthorized());

            verify(profileService, never()).getMyProfile();
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees/{id}/profile — Xem hồ sơ theo ID")
    class GetEmployeeById {

        @Test
        @DisplayName("Manager xem nhân viên trong team → 200")
        void manager_viewsTeamMember_200() throws Exception {
            when(dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID)).thenReturn(true);
            when(profileService.getProfileById(EMPLOYEE1_EMP_ID)).thenReturn(sampleProfile);

            mockMvc.perform(get("/api/v1/employees/{id}/profile", EMPLOYEE1_EMP_ID)
                            .with(SecurityMockMvcRequestPostProcessors.user(managerPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(EMPLOYEE1_EMP_ID));
        }

        @Test
        @DisplayName("HR xem bất kỳ employee → 200")
        void hr_viewsAnyEmployee_200() throws Exception {
            when(dataScopeService.canAccessEmployee(EMPLOYEE2_EMP_ID)).thenReturn(true);
            when(profileService.getProfileById(EMPLOYEE2_EMP_ID)).thenReturn(
                    EmployeeProfileResponse.builder()
                            .id(EMPLOYEE2_EMP_ID).fullName("Le Employee2").email("e2@test.com").build());

            mockMvc.perform(get("/api/v1/employees/{id}/profile", EMPLOYEE2_EMP_ID)
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(EMPLOYEE2_EMP_ID));
        }

        @Test
        @DisplayName("Employee cố xem profile người khác → 403 Forbidden")
        void employee_viewsOther_403() throws Exception {
            // @PreAuthorize gọi dataScopeService → false → 403 trước khi vào service
            when(dataScopeService.canAccessEmployee(EMPLOYEE2_EMP_ID)).thenReturn(false);

            mockMvc.perform(get("/api/v1/employees/{id}/profile", EMPLOYEE2_EMP_ID)
                            .with(SecurityMockMvcRequestPostProcessors.user(employeePrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());

            verify(profileService, never()).getProfileById(anyLong());
        }

        @Test
        @DisplayName("Manager xem employee ngoài team → 403 Forbidden")
        void manager_viewsOutsideTeam_403() throws Exception {
            when(dataScopeService.canAccessEmployee(EMPLOYEE2_EMP_ID)).thenReturn(false);

            mockMvc.perform(get("/api/v1/employees/{id}/profile", EMPLOYEE2_EMP_ID)
                            .with(SecurityMockMvcRequestPostProcessors.user(managerPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());

            verify(profileService, never()).getProfileById(anyLong());
        }

        @Test
        @DisplayName("Không có token → 401 Unauthorized")
        void noToken_401() throws Exception {
            mockMvc.perform(get("/api/v1/employees/{id}/profile", EMPLOYEE1_EMP_ID))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Response không chứa salary, bankAccount, nationalId")
        void responseDoesNotContainSensitiveFields() throws Exception {
            when(dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID)).thenReturn(true);
            when(profileService.getProfileById(EMPLOYEE1_EMP_ID)).thenReturn(sampleProfile);

            mockMvc.perform(get("/api/v1/employees/{id}/profile", EMPLOYEE1_EMP_ID)
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.salary").doesNotExist())
                    .andExpect(jsonPath("$.data.bankAccountNumber").doesNotExist())
                    .andExpect(jsonPath("$.data.nationalId").doesNotExist())
                    .andExpect(jsonPath("$.data.socialSecurityNumber").doesNotExist())
                    .andExpect(jsonPath("$.data.taxId").doesNotExist());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/employees/profiles — Danh sách scope-filtered")
    class ListProfiles {

        @Test
        @DisplayName("HR xem danh sách → 200 trả về page")
        void hr_listAll_200() throws Exception {
            PageResponse<EmployeeProfileResponse> page = PageResponse.<EmployeeProfileResponse>builder()
                    .content(List.of(sampleProfile))
                    .page(0).size(10).totalElements(1L).totalPages(1)
                    .first(true).last(true)
                    .build();

            when(profileService.listProfiles(0, 10, null, null)).thenReturn(page);

            mockMvc.perform(get("/api/v1/employees/profiles")
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.totalElements").value(1));
        }

        @Test
        @DisplayName("Manager xem → 200 chỉ trả team của mình")
        void manager_listTeam_200() throws Exception {
            PageResponse<EmployeeProfileResponse> page = PageResponse.<EmployeeProfileResponse>builder()
                    .content(List.of(sampleProfile))
                    .page(0).size(10).totalElements(1L).totalPages(1)
                    .first(true).last(true)
                    .build();

            when(profileService.listProfiles(0, 10, null, null)).thenReturn(page);

            mockMvc.perform(get("/api/v1/employees/profiles")
                            .with(SecurityMockMvcRequestPostProcessors.user(managerPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Không có token → 401")
        void noToken_401() throws Exception {
            mockMvc.perform(get("/api/v1/employees/profiles"))
                    .andExpect(status().isUnauthorized());
        }
    }
}