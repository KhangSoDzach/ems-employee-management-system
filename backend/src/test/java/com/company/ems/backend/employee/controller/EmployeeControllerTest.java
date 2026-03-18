package com.company.ems.backend.employee.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.service.EmployeeService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@org.springframework.context.annotation.Import({ com.company.ems.backend.config.StorageProperties.class })
@WebMvcTest(EmployeeController.class)
public class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EmployeeService employeeService;

    @MockitoBean
    @SuppressWarnings("unused")
    private com.company.ems.backend.auth.security.JwtTokenUtil jwtTokenUtil;

    @MockitoBean
    @SuppressWarnings("unused")
    private com.company.ems.backend.auth.service.CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private MessageService messages;

    @MockitoBean
    @SuppressWarnings("unused")
    private com.company.ems.backend.common.audit.SecurityAuditService securityAuditService;

    @Test
    @WithMockUser
    void getEmployeeById_returns_ok_and_payload() throws Exception {
        EmployeeResponse resp = EmployeeResponse.builder().id(1L).firstName("T").lastName("U").email("t@u.com").build();
        when(employeeService.getEmployeeById(1L)).thenReturn(resp);
        when(messages.get(org.mockito.ArgumentMatchers.<com.company.ems.backend.common.message.MessageCode>any()))
                .thenReturn("OK");

        mockMvc.perform(get("/api/v1/employees/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.email").value("t@u.com"));
    }
}
