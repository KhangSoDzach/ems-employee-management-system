package com.company.ems.backend.payroll.domain.policy;
import com.company.ems.backend.common.exception.ForbiddenException;

public final class PayrollAccessPolicy {

    private PayrollAccessPolicy() {}

    public record Principal(
            Long   userId,
            Long   employeeId,  // null for users without an employee record (system)
            String role         // canonical role name: EMPLOYEE, MANAGER, HR, ADMIN
    ) {
        public boolean isHrOrAbove() {
            return "HR".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
        }
    }

    public static boolean canViewPayroll(Principal actor, Long targetEmployeeId) {
        if (actor.isHrOrAbove()) return true;
        return actor.employeeId() != null
                && actor.employeeId().equals(targetEmployeeId);
    }

    public static boolean canViewPeriod(Principal actor) {
        return actor.isHrOrAbove();
    }

    public static boolean canExport(Principal actor) {
        return actor.isHrOrAbove();
    }

    public static void requireCanViewPayroll(Principal actor, Long targetEmployeeId) {
        if (!canViewPayroll(actor, targetEmployeeId)) {
            throw new ForbiddenException();
        }
    }

    public static void requireCanViewPeriod(Principal actor) {
        if (!canViewPeriod(actor)) {
            throw new ForbiddenException();
        }
    }

    public static void requireCanExport(Principal actor) {
        if (!canExport(actor)) {
            throw new ForbiddenException();
        }
    }
}
