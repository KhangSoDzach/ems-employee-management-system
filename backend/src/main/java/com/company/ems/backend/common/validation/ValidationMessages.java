package com.company.ems.backend.common.validation;

public final class ValidationMessages {
    private ValidationMessages() {}
    public static final String ASSET_NAME_REQUIRED      = "{asset.validation.name_required}";
    public static final String EMPLOYEE_ID_REQUIRED     = "{asset.validation.employee_id_required}";
    public static final String EMPLOYEE_AGE_RANGE       = "Tuổi phải từ {min} đến {max} tuổi";
    public static final String EMPLOYEE_NATIONAL_ID     = "CCCD/CMND phải gồm 9 hoặc 12 chữ số (VD: 001234567890)";

    public static final String INCIDENT_TYPE_REQUIRED   = "{incident.validation.type_required}";
    public static final String DESCRIPTION_REQUIRED     = "{incident.validation.description_required}";
    public static final String DESCRIPTION_SIZE         = "{incident.validation.description_size}";
}