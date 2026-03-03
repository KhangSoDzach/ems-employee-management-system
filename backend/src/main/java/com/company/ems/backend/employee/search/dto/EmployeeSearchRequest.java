package com.company.ems.backend.employee.search.dto;

import com.company.ems.backend.employee.enums.EmployeeStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class EmployeeSearchRequest {
    @Size(max = 100, message = "Keyword không được vượt quá 100 ký tự")
    String keyword;
    @Size(max = 100)
    String department;
    EmployeeStatus status;
    @Pattern(
            regexp = "^[a-zA-Z,]+$",
            message = "Sort field chỉ được chứa chữ cái và dấu phẩy"
    )
    @Size(max = 50)
    String sortBy;
    @Pattern(regexp = "^(asc|desc)$", message = "Sort direction chỉ được là 'asc' hoặc 'desc'")
    String sortDir;

    @Min(0)
    int page;

    @Min(1) @Max(100)
    int size;
}