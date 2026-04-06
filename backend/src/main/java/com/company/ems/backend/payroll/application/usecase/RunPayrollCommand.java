package com.company.ems.backend.payroll.application.usecase;

public record RunPayrollCommand(String period, String requestedBy) {}
