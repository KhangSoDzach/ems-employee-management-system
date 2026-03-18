package com.company.ems.backend.payroll.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.company.ems.backend.common.exception.ConflictException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.payroll.dto.SalaryComponentRequest;
import com.company.ems.backend.payroll.dto.SalaryComponentResponse;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.payroll.repository.PayrollAuditLogRepository;
import com.company.ems.backend.payroll.repository.SalaryComponentRepository;

@ExtendWith(MockitoExtension.class)
class SalaryComponentServiceImplTest {

    @Mock
    private SalaryComponentRepository salaryComponentRepository;

    @Mock
    private PayrollAuditLogRepository payrollAuditLogRepository;

    @Mock
    private MessageService messages;

    @InjectMocks
    private SalaryComponentServiceImpl salaryComponentService;

    private SalaryComponentRequest request;

    @BeforeEach
    void setUp() {
        request = SalaryComponentRequest.builder()
                .code("BASIC")
                .name("Basic Salary")
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(new BigDecimal("1000.00"))
                .status(SalaryComponentStatus.ACTIVE)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin.user", null));
    }

    @Test
    void createComponent_shouldSaveAndReturn_whenRequestIsValid() {
        SalaryComponent saved = SalaryComponent.builder()
                .code("BASIC")
                .name("Basic Salary")
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(new BigDecimal("1000.00"))
                .status(SalaryComponentStatus.ACTIVE)
                .build();
        saved.setId(1L);
        saved.setCreatedAt(LocalDateTime.now());
        saved.setUpdatedAt(LocalDateTime.now());

        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("BASIC")).thenReturn(false);
        when(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse("Basic Salary")).thenReturn(false);
        when(salaryComponentRepository.save(any(SalaryComponent.class))).thenReturn(saved);

        SalaryComponentResponse result = salaryComponentService.createComponent(request);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("BASIC", result.getCode());
        verify(payrollAuditLogRepository).save(any());
    }

    @Test
    void createComponent_shouldThrowConflict_whenCodeDuplicated() {
        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("BASIC")).thenReturn(true);
        when(messages.get(eq(MessageCode.SALARY_COMPONENT_DUPLICATE_CODE), eq("BASIC")))
                .thenReturn("duplicate code");

        assertThrows(ConflictException.class, () -> salaryComponentService.createComponent(request));

        verify(salaryComponentRepository, never()).save(any());
        verify(payrollAuditLogRepository, never()).save(any());
    }

    @Test
    void updateComponent_shouldThrowNotFound_whenComponentMissing() {
        when(salaryComponentRepository.findByIdAndIsDeletedFalse(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> salaryComponentService.updateComponent(99L, request));
        verify(payrollAuditLogRepository, never()).save(any());
    }

    @Test
    void updateComponent_shouldPersistAndAudit_whenValid() {
        SalaryComponent existing = SalaryComponent.builder()
                .code("OLD_CODE")
                .name("Old Name")
                .type(SalaryComponentType.ALLOWANCE)
                .isTaxable(false)
                .isInsurable(false)
                .amount(new BigDecimal("250.00"))
                .status(SalaryComponentStatus.INACTIVE)
                .build();
        existing.setId(10L);

        SalaryComponent saved = SalaryComponent.builder()
                .code("BASIC")
                .name("Basic Salary")
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(new BigDecimal("1000.00"))
                .status(SalaryComponentStatus.ACTIVE)
                .build();
        saved.setId(10L);

        when(salaryComponentRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(existing));
        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIdNotAndIsDeletedFalse("BASIC", 10L)).thenReturn(false);
        when(salaryComponentRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse("Basic Salary", 10L)).thenReturn(false);
        when(salaryComponentRepository.save(any(SalaryComponent.class))).thenReturn(saved);

        SalaryComponentResponse result = salaryComponentService.updateComponent(10L, request);

        assertEquals("BASIC", result.getCode());
        assertEquals("Basic Salary", result.getName());
        verify(payrollAuditLogRepository).save(any());
    }
}
