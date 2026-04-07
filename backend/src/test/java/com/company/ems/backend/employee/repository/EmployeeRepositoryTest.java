package com.company.ems.backend.employee.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Collections;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.WorkStatus;

@ExtendWith(MockitoExtension.class)
class EmployeeRepositoryTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Test
    void searchEmployeesShouldAcceptWorkStatusFilter() {
        Page<Employee> expected = new PageImpl<>(Collections.emptyList());
        when(employeeRepository.searchEmployees(any(), any(), any(), eq(WorkStatus.PROBATION), any(PageRequest.class)))
                .thenReturn(expected);

        Page<Employee> result = employeeRepository.searchEmployees(
                null,
                null,
                null,
                WorkStatus.PROBATION,
                PageRequest.of(0, 10));

        assertEquals(0, result.getTotalElements());
    }
}
