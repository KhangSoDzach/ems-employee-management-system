package com.company.ems.backend.employee.dto;

import java.time.LocalDate;

import com.company.ems.backend.common.validation.ValidAge;
import com.company.ems.backend.common.validation.ValidationMessages;
import com.company.ems.backend.employee.enums.ContractType;
import com.company.ems.backend.employee.enums.Gender;
import com.company.ems.backend.employee.enums.WorkStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {
    @NotBlank(message = "REQUIRED_FIELD|Tên là bắt buộc|VD: An")
    private String firstName;

    @NotBlank(message = "REQUIRED_FIELD|Họ và tên đệm là bắt buộc|VD: Nguyễn Văn")
    private String lastName;

    @NotBlank(message = "REQUIRED_FIELD|Email là bắt buộc|VD: user@company.com")
    @Email(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "INVALID_FORMAT|Định dạng email không hợp lệ|VD: user@company.com")
    private String email;

    @Pattern(regexp = "^$|^(\\+84[0-9]{9,10}|0[0-9]{9,10})$", message = "INVALID_FORMAT|Số điện thoại không hợp lệ (định dạng Việt Nam)|VD: +84912345678 hoặc 0912345678")
    private String phone;

    @NotNull(message = "REQUIRED_FIELD|Ngày sinh là bắt buộc|YYYY-MM-DD")
    @ValidAge(min = 18, max = 70)
    private LocalDate dateOfBirth;

    @NotNull(message = "Ngày vào làm là bắt buộc")
    private LocalDate hireDate;

    @NotNull(message = "Vị trí công việc là bắt buộc")
    private Long positionId;

    @NotNull(message = "Phòng ban là bắt buộc")
    private Long departmentId;

    @NotNull(message = "Mức lương là bắt buộc")
    private Double salary;

    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;

    private String taxId;
    private String socialSecurityNumber;

    @Pattern(regexp = "^$|^([0-9]{9}|[0-9]{12})$", message = ValidationMessages.EMPLOYEE_NATIONAL_ID)
    private String nationalId;

    private String bankAccountNumber;
    private String bankName;
    private String bankBranch;

    private Long reportingManagerId;
    private ContractType contractType;
    private LocalDate contractStartDate;
    private LocalDate probationEndDate;
    private LocalDate contractEndDate;
    private Integer contractDurationMonths;
    private WorkStatus workStatus;
    private Double probationSalary;
    private Double officialSalary;
    private String workLocation;

    private String nationality;
    private String bloodGroup;
    private Gender gender;
    private String avatarUrl;
    private String notes;

    private Long roleId;
}
