package com.company.ems.backend.employee.service;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.employee.repository.EmployeeProfileRepository;
import com.company.ems.backend.rbac.service.DataScopeServiceImpl;
import com.company.ems.backend.user.enums.DataScope;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DataScopeService — Unit Tests")
class DataScopeServiceTest {

    @Mock  EmployeeProfileRepository profileRepository;
    @InjectMocks DataScopeServiceImpl dataScopeService;

    static final Long MANAGER_USER_ID   = 2L;
    static final Long MANAGER_EMP_ID    = 10L;
    static final Long EMPLOYEE1_USER_ID = 3L;
    static final Long EMPLOYEE1_EMP_ID  = 11L;
    static final Long EMPLOYEE2_EMP_ID  = 12L;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }


    private void setSecurityContext(Long userId, String username, Set<DataScope> scopes) {
        CustomUserPrincipal principal = new CustomUserPrincipal(
                userId, username, "pass", true, true, true, true,
                List.of(new SimpleGrantedAuthority("EMPLOYEE_VIEW")),
                scopes
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @Nested
    @DisplayName("ALL scope (HR / Admin)")
    class AllScope {

        @BeforeEach
        void setup() {
            setSecurityContext(1L, "hr_admin", Set.of(DataScope.ALL));
        }

        @Test
        @DisplayName("HR có thể xem bất kỳ employee")
        void hr_canAccessAnyEmployee() {
            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID)).isTrue();
            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE2_EMP_ID)).isTrue();
            assertThat(dataScopeService.canAccessEmployee(999L)).isTrue();
        }

        @Test
        @DisplayName("HR không cần truy vấn DB — short-circuit")
        void hr_doesNotQueryDatabase() {
            dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID);
            verifyNoInteractions(profileRepository);
        }
    }

    @Nested
    @DisplayName("TEAM scope (Manager)")
    class TeamScope {

        @BeforeEach
        void setup() {
            setSecurityContext(MANAGER_USER_ID, "manager1", Set.of(DataScope.TEAM, DataScope.SELF));
        }

        @Test
        @DisplayName("Manager được xem nhân viên trong team")
        void manager_canAccessTeamMember() {
            when(profileRepository.isEmployeeInManagerTeam(EMPLOYEE1_EMP_ID, MANAGER_USER_ID))
                    .thenReturn(true);

            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID)).isTrue();
        }

        @Test
        @DisplayName("Manager được xem chính mình (self-check)")
        void manager_canAccessOwnProfile() {
            when(profileRepository.isEmployeeInManagerTeam(MANAGER_EMP_ID, MANAGER_USER_ID))
                    .thenReturn(false); // không phải subordinate
            when(profileRepository.findEmployeeIdByUserId(MANAGER_USER_ID))
                    .thenReturn(Optional.of(MANAGER_EMP_ID));

            assertThat(dataScopeService.canAccessEmployee(MANAGER_EMP_ID)).isTrue();
        }

        @Test
        @DisplayName("Manager bị từ chối xem employee ngoài team")
        void manager_cannotAccessOutsideTeam() {
            when(profileRepository.isEmployeeInManagerTeam(EMPLOYEE2_EMP_ID, MANAGER_USER_ID))
                    .thenReturn(false);
            when(profileRepository.findEmployeeIdByUserId(MANAGER_USER_ID))
                    .thenReturn(Optional.of(MANAGER_EMP_ID)); // MANAGER_EMP_ID != EMPLOYEE2_EMP_ID

            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE2_EMP_ID)).isFalse();
        }

        @Test
        @DisplayName("Manager kiểm tra DB team membership — không đoán từ client")
        void manager_checksDatabaseForTeamMembership() {
            when(profileRepository.isEmployeeInManagerTeam(EMPLOYEE1_EMP_ID, MANAGER_USER_ID))
                    .thenReturn(true);

            dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID);

            verify(profileRepository).isEmployeeInManagerTeam(EMPLOYEE1_EMP_ID, MANAGER_USER_ID);
        }
    }

    @Nested
    @DisplayName("SELF scope (Employee)")
    class SelfScope {

        @BeforeEach
        void setup() {
            setSecurityContext(EMPLOYEE1_USER_ID, "employee1", Set.of(DataScope.SELF));
        }

        @Test
        @DisplayName("Employee được xem profile của chính mình")
        void employee_canAccessOwnProfile() {
            when(profileRepository.findEmployeeIdByUserId(EMPLOYEE1_USER_ID))
                    .thenReturn(Optional.of(EMPLOYEE1_EMP_ID));

            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID)).isTrue();
        }

        @Test
        @DisplayName("Employee bị từ chối xem profile người khác")
        void employee_cannotAccessOthersProfile() {
            when(profileRepository.findEmployeeIdByUserId(EMPLOYEE1_USER_ID))
                    .thenReturn(Optional.of(EMPLOYEE1_EMP_ID));

            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE2_EMP_ID)).isFalse();
        }

        @Test
        @DisplayName("Employee không thể bypass bằng cách đổi employeeId")
        void employee_cannotBypassByChangingId() {
            when(profileRepository.findEmployeeIdByUserId(EMPLOYEE1_USER_ID))
                    .thenReturn(Optional.of(EMPLOYEE1_EMP_ID));

            assertThat(dataScopeService.canAccessEmployee(1L)).isFalse();
            assertThat(dataScopeService.canAccessEmployee(999L)).isFalse();
        }

        @Test
        @DisplayName("Employee chưa có employee record → từ chối (Optional.empty)")
        void employee_noRecord_denied() {
            when(profileRepository.findEmployeeIdByUserId(EMPLOYEE1_USER_ID))
                    .thenReturn(Optional.empty());

            assertThat(dataScopeService.canAccessEmployee(EMPLOYEE1_EMP_ID)).isFalse();
        }
    }
}