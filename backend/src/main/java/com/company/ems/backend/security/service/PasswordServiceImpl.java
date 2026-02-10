package com.company.ems.backend.security.service;

import com.company.ems.backend.common.exception.InvalidPasswordException;
import com.company.ems.backend.common.exception.ResourceNotFoundException;
import com.company.ems.backend.common.exception.UnauthorizedException;
import com.company.ems.backend.security.dto.ChangePasswordRequest;
import com.company.ems.backend.security.util.PasswordValidator;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        log.info("Processing password change request for user: {}", username);

        // 1. Find user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 2. Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            log.warn("Failed password change attempt for user: {} - incorrect current password", username);
            throw new UnauthorizedException("Current password is incorrect");
        }

        // 3. Validate password and confirm password match
        PasswordValidator.validatePasswordMatch(
                request.getNewPassword(),
                request.getConfirmPassword()
        );

        // 4. Validate new password strength
        PasswordValidator.validatePassword(request.getNewPassword());

        // 5. Ensure new password is different from current
        PasswordValidator.validatePasswordDifferent(
                request.getCurrentPassword(),
                request.getNewPassword()
        );

        // 6. Hash and save new password
        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPassword(hashedPassword);

        // 7. Reset failed login attempts on successful password change
        user.resetFailedAttempts();

        userRepository.save(user);

        log.info("Password changed successfully for user: {}", username);
    }
}
