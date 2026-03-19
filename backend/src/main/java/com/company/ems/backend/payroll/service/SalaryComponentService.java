package com.company.ems.backend.payroll.service;

import java.util.List;

import com.company.ems.backend.payroll.dto.SalaryComponentRequest;
import com.company.ems.backend.payroll.dto.SalaryComponentResponse;

public interface SalaryComponentService {

    List<SalaryComponentResponse> listComponents();

    SalaryComponentResponse createComponent(SalaryComponentRequest request);

    SalaryComponentResponse updateComponent(Long id, SalaryComponentRequest request);
}
