package com.company.ems.backend.security.service;

import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
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

    private final UserRepository  userRepository;
    private final PasswordEncoder  passwordEncoder;
    private final PasswordValidator passwordValidator;
    private final MessageService   messages;

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        log.info("Processing password change request for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            log.warn("Failed password change attempt for user: {} - incorrect current password", username);
            throw new UnauthorizedException(messages.get(MessageCode.PASSWORD_INCORRECT));
        }
        passwordValidator.validatePasswordMatch(
                request.getNewPassword(),
                request.getConfirmPassword()
        );
        passwordValidator.validatePassword(request.getNewPassword());
        passwordValidator.validatePasswordDifferent(
                request.getCurrentPassword(),
                request.getNewPassword()
        );
        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPassword(hashedPassword);
        user.resetFailedAttempts();
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", username);
    }
}