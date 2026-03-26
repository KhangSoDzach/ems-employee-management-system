package com.company.ems.backend.employee.mapper;

import com.company.ems.backend.employee.dto.EmployeeResponse;
import com.company.ems.backend.employee.dto.MemberResponse;
import com.company.ems.backend.employee.dto.PublicEmployeeResponse;
import com.company.ems.backend.employee.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
@Mapper(componentModel = "spring")
public interface EmployeeMapper {
    @Mapping(target = "position",             source = "position.title")
    @Mapping(target = "positionId",           source = "position.id")
    @Mapping(target = "department",           source = "department.name")
    @Mapping(target = "departmentId",         source = "department.id")
    @Mapping(target = "reportingManagerId",   source = "reportingManager.id")
    @Mapping(target = "reportingManagerName", source = "reportingManager.fullName")
    @Mapping(target = "contractType",         expression = "java(employee.getContractType() != null ? employee.getContractType().name() : null)")
    @Mapping(target = "status",               expression = "java(employee.getStatus() != null ? employee.getStatus().name() : null)")
    @Mapping(target = "workStatus",           expression = "java(employee.getWorkStatus() != null ? employee.getWorkStatus().name() : null)")
    @Mapping(target = "employeeCode",         source = "employeeCode")
    EmployeeResponse toResponse(Employee employee);

    @Mapping(target = "position",   source = "position.title")
    @Mapping(target = "department", source = "department.name")
    @Mapping(target = "status",     expression = "java(employee.getStatus() != null ? employee.getStatus().name() : null)")
    @Mapping(target = "employeeCode", source = "employeeCode")
    PublicEmployeeResponse toPublicResponse(Employee employee);
    @Mapping(target = "positionTitle",   source = "position.title")
    @Mapping(target = "departmentName",  source = "department.name")
    @Mapping(target = "status",          expression = "java(employee.getStatus() != null ? employee.getStatus().name() : null)")
    @Mapping(target = "employeeCode",    source = "employeeCode")
    MemberResponse toMemberResponse(Employee employee);
}