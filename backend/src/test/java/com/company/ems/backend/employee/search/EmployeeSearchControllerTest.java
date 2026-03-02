package com.company.ems.backend.employee.search;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.search.controller.EmployeeSearchController;
import com.company.ems.backend.employee.search.dto.EmployeeListResponse;
import com.company.ems.backend.employee.search.service.EmployeeSearchService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(EmployeeSearchController.class)
@DisplayName("EmployeeSearchController — Integration Tests")
class EmployeeSearchControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean EmployeeSearchService searchService;

    @MockBean JwtTokenUtil jwtTokenUtil;
    @MockBean CustomUserDetailsService userDetailsService;

    private CustomUserPrincipal hrPrincipal() {
        return new CustomUserPrincipal(1L, "hr_admin", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")), Set.of(DataScope.ALL));
    }

    private CustomUserPrincipal managerPrincipal() {
        return new CustomUserPrincipal(2L, "manager1", "pw", true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                Set.of(DataScope.TEAM, DataScope.SELF));
    }

    private PageResponse<EmployeeListResponse> samplePage() {
        var item = EmployeeListResponse.builder()
                .id(11L).employeeCode("EMP-011")
                .fullName("Tran Employee1")
                .email("e1@test.com")
                .departmentName("Engineering")
                .positionTitle("Software Engineer")
                .hireDate(LocalDate.of(2022, 3, 15))
                .status("ACTIVE")
                .build();
        return PageResponse.<EmployeeListResponse>builder()
                .content(List.of(item))
                .page(0).size(10).totalElements(1L).totalPages(1)
                .first(true).last(true).build();
    }

    @Nested
    @DisplayName("GET /api/v1/employees/search")
    class SearchEndpoint {

        @Test
        @DisplayName("HR search với keyword → 200 trả kết quả")
        void hr_search_200() throws Exception {
            when(searchService.search(any())).thenReturn(samplePage());

            mockMvc.perform(get("/api/v1/employees/search")
                            .param("keyword", "employee")
                            .param("page", "0").param("size", "10")
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.content[0].id").value(11))
                    .andExpect(jsonPath("$.data.totalElements").value(1))
                    // Không trả trường nhạy cảm
                    .andExpect(jsonPath("$.data.content[0].salary").doesNotExist())
                    .andExpect(jsonPath("$.data.content[0].bankAccountNumber").doesNotExist())
                    .andExpect(jsonPath("$.data.content[0].nationalId").doesNotExist());
        }

        @Test
        @DisplayName("Manager search → 200")
        void manager_search_200() throws Exception {
            when(searchService.search(any())).thenReturn(samplePage());

            mockMvc.perform(get("/api/v1/employees/search")
                            .with(SecurityMockMvcRequestPostProcessors.user(managerPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("No token → 401 Unauthorized")
        void noToken_401() throws Exception {
            mockMvc.perform(get("/api/v1/employees/search"))
                    .andExpect(status().isUnauthorized());
            verify(searchService, never()).search(any());
        }

        @Test
        @DisplayName("sort=salary → 400 (whitelist violation)")
        void sortBySalary_400() throws Exception {
            when(searchService.search(argThat(req -> "salary".equals(req.getSortBy()))))
                    .thenThrow(new IllegalArgumentException("Sort field 'salary' không được phép"));

            mockMvc.perform(get("/api/v1/employees/search")
                            .param("sortBy", "salary")
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Kết quả rỗng → 200 empty page (không 404)")
        void emptyResult_200EmptyPage() throws Exception {
            var emptyPage = PageResponse.<EmployeeListResponse>builder()
                    .content(List.of()).page(0).size(10)
                    .totalElements(0L).totalPages(0).build();
            when(searchService.search(any())).thenReturn(emptyPage);

            mockMvc.perform(get("/api/v1/employees/search")
                            .param("keyword", "nonexistentxyz")
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content").isArray())
                    .andExpect(jsonPath("$.data.content").isEmpty())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }

        @Test
        @DisplayName("Filter status=ACTIVE → request được build đúng")
        void filterByStatus_requestBuiltCorrectly() throws Exception {
            when(searchService.search(
                    argThat(req -> EmployeeStatus.ACTIVE.equals(req.getStatus()))))
                    .thenReturn(samplePage());

            mockMvc.perform(get("/api/v1/employees/search")
                            .param("status", "ACTIVE")
                            .with(SecurityMockMvcRequestPostProcessors.user(hrPrincipal()))
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }
    }
}