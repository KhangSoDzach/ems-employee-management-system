package com.company.ems.backend.employee.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.company.ems.backend.auth.security.CustomUserPrincipal;
import com.company.ems.backend.common.dto.PageResponse;
import com.company.ems.backend.common.exception.ForbiddenException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.department.entity.Department;
import com.company.ems.backend.department.repository.DepartmentRepository;
import com.company.ems.backend.employee.dto.EmployeeRequest;
import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import com.company.ems.backend.employee.enums.EmployeeStatus;
import com.company.ems.backend.employee.repository.EmployeeRepository;
import com.company.ems.backend.position.entity.Position;
import com.company.ems.backend.position.repository.PositionRepository;
import com.company.ems.backend.rbac.service.DataScopeService;
import com.company.ems.backend.user.enums.DataScope;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PositionRepository positionRepository;

    @Mock
    private DataScopeService dataScopeService;

    @Mock
    private EmployeeEmailNotificationService emailNotificationService;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private Employee employee;
    private Department department;
    private Position position;
    private CustomUserPrincipal adminPrincipal;
    private CustomUserPrincipal managerPrincipal;
    private CustomUserPrincipal employeePrincipal;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1L);
        department.setName("IT");

        position = new Position();
        position.setId(1L);
        position.setTitle("Developer");

        employee = new Employee();
        employee.setId(1L);
        employee.setFirstName("John");
        employee.setLastName("Doe");
        employee.setEmail("john.doe@example.com");
        employee.setDepartment(department);
        employee.setPosition(position);
        employee.setStatus(EmployeeStatus.ACTIVE);

        adminPrincipal = new CustomUserPrincipal(1L, "admin", "password", true, true, true, true,
                Collections.emptyList(), Set.of(DataScope.ALL));
        managerPrincipal = new CustomUserPrincipal(2L, "manager", "password", true, true, true, true,
                Collections.emptyList(), Set.of(DataScope.TEAM));
        employeePrincipal = new CustomUserPrincipal(3L, "emp", "password", true, true, true, true,
                Collections.emptyList(), Set.of(DataScope.SELF));
    }

    @Test
    void createEmployee_Success() {
        EmployeeRequest request = new EmployeeRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane.doe@example.com");
        request.setDepartmentId(1L);
        request.setPositionId(1L);

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> {
            Employee emp = i.getArgument(0);
            emp.setId(2L);
            return emp;
        });

        EmployeeResponse response = employeeService.createEmployee(request);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("Jane", response.getFirstName());
        assertEquals("IT", response.getDepartment());
        assertEquals("Developer", response.getPosition());

        verify(employeeRepository, times(1)).save(any(Employee.class));
        // DOB is null in this request → email notification must be skipped
        verify(emailNotificationService, never()).notifyNewEmployeeAsync(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void createEmployee_ShouldSendEmail_WhenDateOfBirthIsProvided() {
        // Given
        EmployeeRequest request = new EmployeeRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane.doe@example.com");
        request.setDepartmentId(1L);
        request.setPositionId(1L);
        request.setDateOfBirth(LocalDate.of(1999, 2, 11)); // DOB: 11/02/99

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> {
            Employee emp = i.getArgument(0);
            emp.setId(3L);
            emp.setEmployeeCode("IT202600001");
            return emp;
        });
        doNothing().when(emailNotificationService)
                .notifyNewEmployeeAsync(anyString(), anyString(), anyString(), anyString());

        // When
        EmployeeResponse response = employeeService.createEmployee(request);

        // Then
        assertNotNull(response);
        // Default password = employeeCode + DOB as ddMMyy = IT202600001 + 110299
        verify(emailNotificationService, times(1))
                .notifyNewEmployeeAsync(
                        eq("jane.doe@example.com"),
                        eq("Jane Doe"),
                        eq("IT202600001"),
                        eq("IT202600001110299"));
    }

    @Test
    void createEmployee_DepartmentNotFound() {
        EmployeeRequest request = new EmployeeRequest();
        request.setDepartmentId(99L);

        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> employeeService.createEmployee(request));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void getEmployeeById_AdminScope_Success() {
        when(dataScopeService.getCurrentPrincipal()).thenReturn(adminPrincipal);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        doNothing().when(dataScopeService).assertCanAccessEmployee(adminPrincipal, 1L);

        EmployeeResponse response = employeeService.getEmployeeById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("John", response.getFirstName());
    }

    @Test
    void getEmployeeById_Forbidden() {
        when(dataScopeService.getCurrentPrincipal()).thenReturn(employeePrincipal);
        doThrow(new ForbiddenException("Access Denied")).when(dataScopeService)
                .assertCanAccessEmployee(employeePrincipal, 2L);

        assertThrows(ForbiddenException.class, () -> employeeService.getEmployeeById(2L));
        verify(employeeRepository, never()).findById(any());
    }

    @Test
    void getAllEmployees_AdminScope() {
        when(dataScopeService.getCurrentPrincipal()).thenReturn(adminPrincipal);
        Page<Employee> page = new PageImpl<>(List.of(employee));
        when(employeeRepository.searchEmployees(any(), any(), any(), any(), any(PageRequest.class))).thenReturn(page);

        PageResponse<EmployeeResponse> response = employeeService.getAllEmployees(0, 10, null, null, null, null);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("John", response.getContent().get(0).getFirstName());
    }

    @Test
    void getAllEmployees_ManagerScope() {
        when(dataScopeService.getCurrentPrincipal()).thenReturn(managerPrincipal);
        Employee manager = new Employee();
        manager.setId(2L);
        when(employeeRepository.findByUserId(2L)).thenReturn(Optional.of(manager));

        Page<Employee> page = new PageImpl<>(List.of(employee));
        when(employeeRepository.searchEmployeesByManager(eq(2L), any(), any(), any(), any(), any(PageRequest.class)))
                .thenReturn(page);

        PageResponse<EmployeeResponse> response = employeeService.getAllEmployees(0, 10, null, null, null, null);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
    }

    @Test
    void updateEmployee_Success() {
        when(dataScopeService.getCurrentPrincipal()).thenReturn(adminPrincipal);
        doNothing().when(dataScopeService).assertCanAccessEmployee(adminPrincipal, 1L);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(positionRepository.findById(1L)).thenReturn(Optional.of(position));

        EmployeeRequest request = new EmployeeRequest();
        request.setFirstName("John Updated");
        request.setDepartmentId(1L);
        request.setPositionId(1L);

        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        EmployeeResponse response = employeeService.updateEmployee(1L, request);

        assertNotNull(response);
        assertEquals("John Updated", employee.getFirstName());
        verify(employeeRepository, times(1)).save(employee);
    }
}
