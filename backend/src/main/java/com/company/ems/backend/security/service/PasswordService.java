package com.company.ems.backend.security.service;

import com.company.ems.backend.security.dto.ChangePasswordRequest;

public interface PasswordService {
    void changePassword(String username, ChangePasswordRequest request);
}

