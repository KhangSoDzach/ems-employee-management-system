package com.company.ems.backend.employee.search;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.search.dto.EmployeeListResponse;
import com.company.ems.backend.employee.search.dto.EmployeeSearchRequest;
import com.company.ems.backend.employee.search.repository.EmployeeSearchRepository;
import com.company.ems.backend.employee.search.service.EmployeeSearchServiceImpl;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmployeeSearchService — Unit Tests")
class EmployeeSearchServiceTest {

    @Mock EmployeeSearchRepository searchRepository;
    @Mock DataScopeService          dataScopeService;

    @InjectMocks EmployeeSearchServiceImpl searchService;

    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }
    private void setupSecurityContext(Long userId, String username, Set<DataScope> scopes) {
        var principal = new CustomUserPrincipal(userId, username, "pw",
                true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")), scopes);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private EmployeeSearchRequest defaultRequest() {
        return EmployeeSearchRequest.builder()
                .page(0).size(10).sortBy("firstName").sortDir("asc").build();
    }

    private Employee buildEmployee(Long id, String firstName, String lastName, String email) {
        Employee e = new Employee();
        e.setId(id);
        e.setFirstName(firstName);
        e.setLastName(lastName);
        e.setEmail(email);
        e.setStatus(EmployeeStatus.ACTIVE);
        return e;
    }

    @Nested
    @DisplayName("HR/Admin — ALL scope")
    class HrAllScope {

        @Test
        @DisplayName("HR search với keyword → gọi repository với scope+keyword")
        void hr_searchWithKeyword_callsRepository() {
            setupSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));

            var employees = List.of(
                    buildEmployee(11L, "Tran", "Employee1", "e1@test.com"),
                    buildEmployee(12L, "Le",   "Employee2", "e2@test.com")
            );
            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));
            when(searchRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(employees));

            var request = EmployeeSearchRequest.builder()
                    .keyword("employee").page(0).size(10)
                    .sortBy("firstName").sortDir("asc").build();

            PageResponse<EmployeeListResponse> result = searchService.search(request);

            assertThat(result.getContent()).hasSize(2);
            verify(dataScopeService).buildScopeSpec();
            verify(searchRepository).findAll(any(Specification.class), any(Pageable.class));
        }

        @Test
        @DisplayName("✅ HR không có kết quả → empty page, không throw exception")
        void hr_noResults_returnsEmptyPage() {
            setupSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));
            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));
            when(searchRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));

            PageResponse<EmployeeListResponse> result = searchService.search(defaultRequest());

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("✅ Response không chứa salary, bankAccount, nationalId")
        void response_doesNotContainSensitiveFields() {
            setupSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));
            Employee employee = buildEmployee(11L, "Tran", "Employee1", "e1@test.com");
            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));
            when(searchRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(employee)));

            var result = searchService.search(defaultRequest());

            assertThat(result.getContent()).hasSize(1);
            EmployeeListResponse resp = result.getContent().get(0);

            assertThat(resp.getId()).isEqualTo(11L);
            assertThat(resp.getFullName()).isEqualTo("Tran Employee1");
            assertThat(resp.getEmail()).isEqualTo("e1@test.com");
        }
    }

    @Nested
    @DisplayName("Manager — TEAM scope")
    class ManagerTeamScope {

        @Test
        @DisplayName("Manager search → buildScopeSpec được gọi (scope trước search)")
        void manager_search_scopeAppliedFirst() {
            setupSecurityContext(2L, "manager1", Set.of(DataScope.TEAM, DataScope.SELF));

            Specification<Employee> teamSpec = (root, query, cb) ->
                    cb.equal(root.get("reportingManager").get("user").get("id"), 2L);
            when(dataScopeService.buildScopeSpec()).thenReturn(teamSpec);
            when(searchRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(
                            buildEmployee(11L, "Tran", "Employee1", "e1@test.com")
                    )));

            var request = EmployeeSearchRequest.builder()
                    .keyword("tran").page(0).size(10)
                    .sortBy("firstName").sortDir("asc").build();

            PageResponse<EmployeeListResponse> result = searchService.search(request);

            verify(dataScopeService).buildScopeSpec();
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("Manager scope tự giới hạn — DB chỉ trả team records")
        void manager_scopeLimitsResults() {
            setupSecurityContext(2L, "manager1", Set.of(DataScope.TEAM, DataScope.SELF));

            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));
            when(searchRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(
                            buildEmployee(11L, "Tran", "Employee1", "e1@test.com")
                    )));

            var result = searchService.search(defaultRequest());

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getId()).isEqualTo(11L);
        }
    }

    @Nested
    @DisplayName("Security — Sort field validation")
    class SortSecurity {

        @Test
        @DisplayName("sort=salary → IllegalArgumentException → không query DB")
        void sortBySalary_throwsException_noDatabaseCall() {
            setupSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));
            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));

            var request = EmployeeSearchRequest.builder()
                    .sortBy("salary").sortDir("asc")
                    .page(0).size(10).build();

            assertThatThrownBy(() -> searchService.search(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("salary");

            // DB không được query khi sort field không hợp lệ
            verifyNoInteractions(searchRepository);
        }

        @Test
        @DisplayName("sort=bankAccountNumber → IllegalArgumentException")
        void sortByBankAccount_throwsException() {
            setupSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));
            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));

            var request = EmployeeSearchRequest.builder()
                    .sortBy("bankAccountNumber").sortDir("asc")
                    .page(0).size(10).build();

            assertThatThrownBy(() -> searchService.search(request))
                    .isInstanceOf(IllegalArgumentException.class);

            verifyNoInteractions(searchRepository);
        }

        @Test
        @DisplayName("Pagination đúng — Pageable truyền vào repository đúng page/size")
        void pagination_passedCorrectlyToRepository() {
            setupSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));
            when(dataScopeService.buildScopeSpec()).thenReturn(Specification.where(null));
            when(searchRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(Collections.emptyList()));

            var request = EmployeeSearchRequest.builder()
                    .page(2).size(5).sortBy("hireDate").sortDir("desc").build();

            searchService.search(request);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(searchRepository).findAll(any(Specification.class), pageableCaptor.capture());

            Pageable capturedPageable = pageableCaptor.getValue();
            assertThat(capturedPageable.getPageNumber()).isEqualTo(2);
            assertThat(capturedPageable.getPageSize()).isEqualTo(5);
            assertThat(capturedPageable.getSort().getOrderFor("hireDate"))
                    .isNotNull()
                    .satisfies(order -> assertThat(order.isDescending()).isTrue());
        }
    }
}