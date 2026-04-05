package com.company.ems.backend.auth.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.company.ems.backend.auditlog.dto.RequestContext;
import com.company.ems.backend.auditlog.enums.AuthActionType;
import com.company.ems.backend.auditlog.service.AuditLogService;
import com.company.ems.backend.auth.config.JwtProperties;
import com.company.ems.backend.auth.dto.AuthResponse;
import com.company.ems.backend.auth.dto.ChangePasswordRequest;
import com.company.ems.backend.auth.dto.LoginRequest;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.security.service.TwoFactorAuthService;
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

    @Mock
    private TwoFactorAuthService twoFactorAuthService;

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

    @Test
    void login_ReturnsTwoFactorRequired_WhenEnabledAndCodeMissing() {
        user.setTwoFactorEnabled(true);

        LoginRequest loginRequest = LoginRequest.builder()
                .username("testuser")
                .password("old_password")
                .build();

        Authentication authentication = mock(Authentication.class);

        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);

        AuthResponse response = authenticationService.login(loginRequest, requestContext);

        assertTrue(Boolean.TRUE.equals(response.getTwoFactorRequired()));
        assertNull(response.getAccessToken());
        verify(twoFactorAuthService, never()).verifyCodeForLogin(anyString(), anyString());
        verify(refreshTokenService, never()).createRefreshToken(any(), anyString());
    }

    @Test
    void login_Success_WhenEnabledAndValidTwoFactorCode() {
        user.setTwoFactorEnabled(true);

        LoginRequest loginRequest = LoginRequest.builder()
                .username("testuser")
                .password("old_password")
                .twoFactorCode("123456")
                .build();

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "testuser",
                "encoded_old_password",
                java.util.List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(twoFactorAuthService.verifyCodeForLogin("testuser", "123456")).thenReturn(true);
        when(jwtTokenUtil.generateAccessToken(userDetails)).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(eq(user), anyString())).thenReturn("refresh-token");
        when(jwtProperties.getExpirationMs()).thenReturn(3_600_000L);

        AuthResponse response = authenticationService.login(loginRequest, requestContext);

        assertFalse(Boolean.TRUE.equals(response.getTwoFactorRequired()));
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(twoFactorAuthService).verifyCodeForLogin("testuser", "123456");
        verify(auditLogService).logAuthEvent(
            eq(AuthActionType.LOGIN_SUCCESS),
            eq("testuser"),
            eq("1"),
            eq("testuser"),
            eq("JWT"),
            eq("SUCCESS"),
            eq(requestContext)
        );
    }
}
