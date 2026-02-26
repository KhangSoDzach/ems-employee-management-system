package com.company.ems.backend.employee.search;

import com.company.ems.backend.employee.search.service.AllowedSortFields;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("EmployeeSearchSecurity — Sort Field Whitelist Tests")
class EmployeeSpecificationTest {

    @Nested
    @DisplayName("AllowedSortFields — Whitelist validation")
    class SortFieldWhitelistTests {

        @Test
        @DisplayName("Các field hợp lệ được chấp nhận")
        void validSortFields_accepted() {
            assertThat(AllowedSortFields.validateSortField("firstName")).isEqualTo("firstName");
            assertThat(AllowedSortFields.validateSortField("lastName")).isEqualTo("lastName");
            assertThat(AllowedSortFields.validateSortField("email")).isEqualTo("email");
            assertThat(AllowedSortFields.validateSortField("employeeCode")).isEqualTo("employeeCode");
            assertThat(AllowedSortFields.validateSortField("hireDate")).isEqualTo("hireDate");
            assertThat(AllowedSortFields.validateSortField("status")).isEqualTo("status");
        }

        @Test
        @DisplayName("sort=salary → IllegalArgumentException (thông tin nhạy cảm)")
        void salary_throwsException() {
            assertThatThrownBy(() -> AllowedSortFields.validateSortField("salary"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("salary");
        }

        @Test
        @DisplayName("sort=bankAccountNumber → IllegalArgumentException")
        void bankAccount_throwsException() {
            assertThatThrownBy(() -> AllowedSortFields.validateSortField("bankAccountNumber"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("sort=nationalId → IllegalArgumentException")
        void nationalId_throwsException() {
            assertThatThrownBy(() -> AllowedSortFields.validateSortField("nationalId"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("sort=socialSecurityNumber → IllegalArgumentException")
        void ssn_throwsException() {
            assertThatThrownBy(() -> AllowedSortFields.validateSortField("socialSecurityNumber"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("null/blank → fallback về default field (firstName)")
        void nullOrBlank_returnsDefault() {
            assertThat(AllowedSortFields.validateSortField(null)).isEqualTo("firstName");
            assertThat(AllowedSortFields.validateSortField("")).isEqualTo("firstName");
            assertThat(AllowedSortFields.validateSortField("   ")).isEqualTo("firstName");
        }

        @Test
        @DisplayName("SQL injection attempt → IllegalArgumentException")
        void sqlInjection_rejected() {
            assertThatThrownBy(() ->
                    AllowedSortFields.validateSortField("firstName; DROP TABLE employees"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}