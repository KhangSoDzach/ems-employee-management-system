package com.company.ems.backend.common.constant;
public enum AppRoleType {

    EMPLOYEE,
    MANAGER,
    HR,
    ADMIN;
    public String authority() {
        return "ROLE_" + this.name();
    }
    public String roleName() {
        return this.name();
    }
}