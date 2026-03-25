package com.company.ems.backend.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EmailSubject {
    PASSWORD_RESET("[EMS] Mã xác thực đặt lại mật khẩu"),
    ACCOUNT_CREDENTIALS("[EMS] Thông tin tài khoản của bạn");

    private final String subject;
}
