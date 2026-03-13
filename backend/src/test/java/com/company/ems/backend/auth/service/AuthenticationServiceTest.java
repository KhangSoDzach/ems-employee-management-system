package com.company.ems.backend.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.auth.config.JwtProperties;
import com.company.ems.backend.auth.dto.ChangePasswordRequest;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private MessageService messages;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenUtil jwtTokenUtil;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthenticationService authenticationService;

    private User user;
    private RequestContext requestContext;
    private ChangePasswordRequest changePasswordRequest;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("testuser")
                .password("encoded_old_password")
                .enabled(true)
                .accountNonLocked(true)
                .build();
        user.setId(1L);

        requestContext = RequestContext.builder().ipAddress("127.0.0.1").build();

        changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("old_password");
        changePasswordRequest.setNewPassword("new_password");
    }

    @Test
    void changePassword_Success_WhenValidCurrentPassword() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old_password", "encoded_old_password")).thenReturn(true);
        when(passwordEncoder.matches("new_password", "encoded_old_password")).thenReturn(false);
        when(passwordEncoder.encode("new_password")).thenReturn("encoded_new_password");

        authenticationService.changePassword(1L, changePasswordRequest, requestContext);

        assertEquals("encoded_new_password", user.getPassword());
        assertNotNull(user.getLastPasswordChange());
        assertFalse(user.getForcePasswordChange());

        verify(userRepository).save(user);
        verify(refreshTokenService).revokeAllUserTokens(1L);
        verify(auditLogService).logAuthEvent(
                eq(AuthActionType.PASSWORD_CHANGED), 
                eq("testuser"), 
                eq("1"), 
                eq("testuser"), 
                eq("JWT"), 
                eq("SUCCESS"), 
                eq(requestContext)
        );
    }

    @Test
    void changePassword_ThrowsException_WhenUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> 
            authenticationService.changePassword(1L, changePasswordRequest, requestContext)
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_ThrowsException_WhenInvalidCurrentPassword() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old_password", "encoded_old_password")).thenReturn(false);
        when(messages.get(any(MessageCode.class))).thenReturn("Invalid credentials");

        assertThrows(BadCredentialsException.class, () -> 
            authenticationService.changePassword(1L, changePasswordRequest, requestContext)
        );

        verify(auditLogService).logAuthEvent(
                eq(AuthActionType.LOGIN_FAILED), 
                anyString(), 
                anyString(), 
                anyString(), 
                anyString(), 
                eq("FAILED"), 
                any()
        );
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_ThrowsException_WhenNewPasswordSameAsCurrent() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old_password", "encoded_old_password")).thenReturn(true);
        when(passwordEncoder.matches("new_password", "encoded_old_password")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> 
            authenticationService.changePassword(1L, changePasswordRequest, requestContext)
        );

        verify(userRepository, never()).save(any());
    }
}
