package com.company.ems.backend.rbac.service;
public interface DataScopeService {
    boolean canAccessEmployee(Long targetEmployeeId);
    boolean isInManagerTeam(Long targetEmployeeId);
    boolean isSelfEmployee(Long targetEmployeeId);
}