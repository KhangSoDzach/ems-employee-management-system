package com.company.ems.backend.payroll.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.payroll.dto.SalaryComponentRequest;
import com.company.ems.backend.payroll.dto.SalaryComponentResponse;
import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.payroll.service.SalaryComponentService;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SalaryComponentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SalaryComponentService salaryComponentService;

    @MockBean
    private MessageService messageService;

    @MockBean
    private com.company.ems.backend.auth.security.JwtTokenUtil jwtTokenUtil;

    @MockBean
    private com.company.ems.backend.auth.service.CustomUserDetailsService customUserDetailsService;

    @MockBean
    private com.company.ems.backend.common.audit.SecurityAuditService securityAuditService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void createComponent_shouldReturnCreated_whenRoleIsAdmin() throws Exception {
        SalaryComponentRequest request = sampleRequest();
        SalaryComponentResponse response = SalaryComponentResponse.builder()
                .id(1L)
                .code("BASIC")
                .name("Basic Salary")
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(new BigDecimal("1000.00"))
                .status(SalaryComponentStatus.ACTIVE)
                .build();

        when(messageService.get(MessageCode.SALARY_COMPONENT_CREATED)).thenReturn("Created");
        when(salaryComponentService.createComponent(any(SalaryComponentRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/payroll/components")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

            @Test
            @WithMockUser(roles = "HR")
            void createComponent_shouldReturnForbidden_whenRoleIsHr() throws Exception {
                mockMvc.perform(post("/api/v1/payroll/components")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(sampleRequest())))
                        .andExpect(status().isForbidden());
            }

    private SalaryComponentRequest sampleRequest() {
        return SalaryComponentRequest.builder()
                .code("BASIC")
                .name("Basic Salary")
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(new BigDecimal("1000.00"))
                .status(SalaryComponentStatus.ACTIVE)
                .build();
    }
}
