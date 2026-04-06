package com.company.ems.backend.payroll.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
import com.company.ems.backend.payroll.entity.AuditLog;
import com.company.ems.backend.payroll.dto.SalaryComponentRequest;
import com.company.ems.backend.payroll.dto.SalaryComponentResponse;
import com.company.ems.backend.payroll.entity.SalaryComponent;
import com.company.ems.backend.payroll.enums.SalaryComponentNature;
import com.company.ems.backend.payroll.enums.SalaryComponentStatus;
import com.company.ems.backend.payroll.enums.SalaryComponentType;
import com.company.ems.backend.payroll.repository.PayrollAuditLogRepository;
import com.company.ems.backend.payroll.repository.SalaryComponentRepository;

@ExtendWith(MockitoExtension.class)
class SalaryComponentServiceImplTest {

    private static final String BASIC_CODE = "BASIC";
    private static final String BASIC_NAME = "Basic Salary";
    private static final BigDecimal BASIC_AMOUNT = new BigDecimal("1000.00");
    private static final Long COMPONENT_ID = 10L;
    private static final Long MISSING_COMPONENT_ID = 99L;

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
    @SuppressWarnings("unused")
    void setUp() {
        request = SalaryComponentRequest.builder()
                .code(BASIC_CODE)
                .name(BASIC_NAME)
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(BASIC_AMOUNT)
                .status(SalaryComponentStatus.ACTIVE)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin.user", null));
    }

    @Test
    void createComponentShouldSaveAndReturnWhenRequestIsValid() {
        SalaryComponent saved = SalaryComponent.builder()
                .code(BASIC_CODE)
                .name(BASIC_NAME)
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(BASIC_AMOUNT)
                .status(SalaryComponentStatus.ACTIVE)
                .build();
        saved.setId(1L);
        saved.setCreatedAt(LocalDateTime.now());
        saved.setUpdatedAt(LocalDateTime.now());

        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(BASIC_CODE)).thenReturn(false);
        when(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse(BASIC_NAME)).thenReturn(false);
        when(salaryComponentRepository.save(org.mockito.ArgumentMatchers.<SalaryComponent>any())).thenReturn(saved);

        SalaryComponentResponse result = salaryComponentService.createComponent(request);

        assertEquals(1L, result.getId());
        assertEquals(BASIC_CODE, result.getCode());
        verify(payrollAuditLogRepository).save(org.mockito.ArgumentMatchers.<AuditLog>any());
    }

    @Test
    void createComponentShouldThrowConflictWhenCodeDuplicated() {
        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse(BASIC_CODE)).thenReturn(true);
        when(messages.get(eq(MessageCode.SALARY_COMPONENT_DUPLICATE_CODE), eq(BASIC_CODE)))
                .thenReturn("duplicate code");

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> salaryComponentService.createComponent(request)
        );
        assertNotNull(exception.getMessage());

        verify(salaryComponentRepository, never()).save(org.mockito.ArgumentMatchers.<SalaryComponent>any());
        verify(payrollAuditLogRepository, never()).save(org.mockito.ArgumentMatchers.<AuditLog>any());
    }

    @Test
    void updateComponentShouldThrowNotFoundWhenComponentMissing() {
        when(salaryComponentRepository.findByIdAndIsDeletedFalse(MISSING_COMPONENT_ID)).thenReturn(Optional.empty());

        ResourceNotFoundException exception = assertThrows(
                ResourceNotFoundException.class,
                () -> salaryComponentService.updateComponent(MISSING_COMPONENT_ID, request)
        );
        assertNotNull(exception.getMessage());
        verify(payrollAuditLogRepository, never()).save(org.mockito.ArgumentMatchers.<AuditLog>any());
    }

    @Test
    void updateComponentShouldPersistAndAuditWhenValid() {
        SalaryComponent existing = SalaryComponent.builder()
                .code("OLD_CODE")
                .name("Old Name")
                .type(SalaryComponentType.ALLOWANCE)
                .isTaxable(false)
                .isInsurable(false)
                .amount(new BigDecimal("250.00"))
                .status(SalaryComponentStatus.INACTIVE)
                .build();
        existing.setId(COMPONENT_ID);

        SalaryComponent saved = SalaryComponent.builder()
                .code(BASIC_CODE)
                .name(BASIC_NAME)
                .type(SalaryComponentType.BASE)
                .isTaxable(true)
                .isInsurable(true)
                .amount(BASIC_AMOUNT)
                .status(SalaryComponentStatus.ACTIVE)
                .build();
        saved.setId(COMPONENT_ID);

        when(salaryComponentRepository.findByIdAndIsDeletedFalse(COMPONENT_ID)).thenReturn(Optional.of(existing));
        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIdNotAndIsDeletedFalse(BASIC_CODE, COMPONENT_ID)).thenReturn(false);
        when(salaryComponentRepository.existsByNameIgnoreCaseAndIdNotAndIsDeletedFalse(BASIC_NAME, COMPONENT_ID)).thenReturn(false);
        when(salaryComponentRepository.save(org.mockito.ArgumentMatchers.<SalaryComponent>any())).thenReturn(saved);

        SalaryComponentResponse result = salaryComponentService.updateComponent(COMPONENT_ID, request);

        assertEquals(BASIC_CODE, result.getCode());
        assertEquals(BASIC_NAME, result.getName());
        verify(payrollAuditLogRepository).save(org.mockito.ArgumentMatchers.<AuditLog>any());
    }

        @Test
        @SuppressWarnings("null")
        void createComponentShouldForceInsuranceAsDeductionAndDisableFlags() {
                SalaryComponentRequest insuranceRequest = SalaryComponentRequest.builder()
                                .code("BHXH")
                                .name("Bảo hiểm xã hội")
                                .type(SalaryComponentType.INSURANCE)
                                .nature(SalaryComponentNature.INCOME)
                                .isTaxable(true)
                                .isInsurable(true)
                                .ratePercent(new BigDecimal("8"))
                                .status(SalaryComponentStatus.ACTIVE)
                                .build();

                SalaryComponent saved = SalaryComponent.builder()
                                .code("BHXH")
                                .name("Bảo hiểm xã hội")
                                .type(SalaryComponentType.INSURANCE)
                                .nature(SalaryComponentNature.DEDUCTION)
                                .isTaxable(false)
                                .isInsurable(false)
                                .ratePercent(new BigDecimal("8"))
                                .status(SalaryComponentStatus.ACTIVE)
                                .build();
                saved.setId(2L);

                when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("BHXH")).thenReturn(false);
                when(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse("Bảo hiểm xã hội")).thenReturn(false);
                when(salaryComponentRepository.save(org.mockito.ArgumentMatchers.<SalaryComponent>any())).thenReturn(saved);

                SalaryComponentResponse response = salaryComponentService.createComponent(insuranceRequest);

                ArgumentCaptor<SalaryComponent> componentCaptor = ArgumentCaptor.forClass(SalaryComponent.class);
                verify(salaryComponentRepository).save(componentCaptor.capture());

                SalaryComponent persisted = componentCaptor.getValue();
                assertEquals(SalaryComponentNature.DEDUCTION, persisted.getNature());
                assertEquals(false, persisted.getIsTaxable());
                assertEquals(false, persisted.getIsInsurable());

                assertEquals(SalaryComponentNature.DEDUCTION, response.getNature());
                assertEquals(false, response.getIsTaxable());
                assertEquals(false, response.getIsInsurable());
        }
}
