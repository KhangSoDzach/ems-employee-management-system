package com.company.ems.backend.payroll.repository;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SalaryComponentRepositoryTest {

    @Mock
    private SalaryComponentRepository salaryComponentRepository;

    @Test
    void existsByCode_shouldReturnExpectedValue() {
        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("BASIC")).thenReturn(true);
        when(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("UNKNOWN")).thenReturn(false);

        assertTrue(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("BASIC"));
        assertFalse(salaryComponentRepository.existsByCodeIgnoreCaseAndIsDeletedFalse("UNKNOWN"));
    }

    @Test
    void existsByName_shouldReturnExpectedValue() {
        when(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse("Basic Salary")).thenReturn(true);
        when(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse("No Name")).thenReturn(false);

        assertTrue(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse("Basic Salary"));
        assertFalse(salaryComponentRepository.existsByNameIgnoreCaseAndIsDeletedFalse("No Name"));
    }
}
