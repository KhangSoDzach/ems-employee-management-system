package com.company.ems.backend.security.service;

import com.company.ems.backend.security.dto.Disable2FARequest;
import com.company.ems.backend.security.dto.TwoFactorAuthResponse;
import com.company.ems.backend.security.dto.Verify2FARequest;

public interface TwoFactorAuthService {
    TwoFactorAuthResponse setup2FA(String username);
    TwoFactorAuthResponse verify2FA(String username, Verify2FARequest request);
    TwoFactorAuthResponse disable2FA(String username, Disable2FARequest request);
    boolean verifyCodeForLogin(String username, String code);
    boolean is2FAEnabled(String username);
}
