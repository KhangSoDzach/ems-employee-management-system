package com.company.ems.backend.auth;

import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.event.AuditLogEvent;
import com.company.ems.backend.auth.config.JwtProperties;
import com.company.ems.backend.auth.entity.RefreshToken;
import com.company.ems.backend.auth.repository.RefreshTokenRepository;
import com.company.ems.backend.auth.security.JwtTokenUtil;
import com.company.ems.backend.auth.service.AuthenticationService;
import com.company.ems.backend.auth.service.CustomUserDetailsService;
import com.company.ems.backend.auth.service.RefreshTokenService;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("US-06: Logout — Unit Tests")
class LogoutServiceTest {
    @Mock AuthenticationManager     authenticationManager;
    @Mock UserRepository            userRepository;
    @Mock JwtTokenUtil              jwtTokenUtil;
    @Mock RefreshTokenService       refreshTokenService;
    @Mock CustomUserDetailsService  userDetailsService;
    @Mock JwtProperties             jwtProperties;
    @Mock ApplicationEventPublisher eventPublisher;

    @InjectMocks AuthenticationService authenticationService;
    private static final String DEVICE_INFO  = "Mozilla/5.0 | IP: 192.168.1.1";
    private static final String REFRESH_TOK  = "valid-refresh-token-string";
    private static final Long   USER_ID      = 42L;
    private static final String USERNAME     = "john.doe";

    @Nested
    @DisplayName("logout() — single session")
    class SingleSessionLogout {

        @Test
        @DisplayName("Logout thành công → token bị revoke + audit LOGOUT/SUCCESS")
        void logout_success_revokesTokenAndAuditsSuccess() {
            when(refreshTokenService.revokeRefreshToken(REFRESH_TOK)).thenReturn(true);
            authenticationService.logout(REFRESH_TOK, DEVICE_INFO, USER_ID, USERNAME);
            verify(refreshTokenService).revokeRefreshToken(REFRESH_TOK);
            ArgumentCaptor<AuditLogEvent> captor = ArgumentCaptor.forClass(AuditLogEvent.class);
            verify(eventPublisher).publishEvent(captor.capture());

            AuditLogEvent event = captor.getValue();
            assertThat(event.getActionType()).isEqualTo(AuditActionType.LOGOUT);
            assertThat(event.getResult()).isEqualTo(AuditResult.SUCCESS);
            assertThat(event.getUserId()).isEqualTo(USER_ID);
            assertThat(event.getIdentifierAttempted()).isEqualTo(USERNAME);
            assertThat(event.getSource()).isNotNull();
        }

        @Test
        @DisplayName("Double logout → không crash, ghi audit LOGOUT/FAILED (idempotent)")
        void logout_doubleLogout_doesNotCrash_auditsFailure() {
            when(refreshTokenService.revokeRefreshToken(REFRESH_TOK)).thenReturn(false);
            authenticationService.logout(REFRESH_TOK, DEVICE_INFO, USER_ID, USERNAME);
            ArgumentCaptor<AuditLogEvent> captor = ArgumentCaptor.forClass(AuditLogEvent.class);
            verify(eventPublisher).publishEvent(captor.capture());

            AuditLogEvent event = captor.getValue();
            assertThat(event.getActionType()).isEqualTo(AuditActionType.LOGOUT);
            assertThat(event.getResult()).isEqualTo(AuditResult.FAILED);
            assertThat(event.getMessage()).contains("already revoked");
        }

        @Test
        @DisplayName("Token không tồn tại → không crash, ghi audit LOGOUT/FAILED")
        void logout_tokenNotFound_doesNotCrash_auditsFailure() {
            when(refreshTokenService.revokeRefreshToken("unknown-token")).thenReturn(false);
            authenticationService.logout("unknown-token", DEVICE_INFO, USER_ID, USERNAME);

            ArgumentCaptor<AuditLogEvent> captor = ArgumentCaptor.forClass(AuditLogEvent.class);
            verify(eventPublisher).publishEvent(captor.capture());

            assertThat(captor.getValue().getResult()).isEqualTo(AuditResult.FAILED);
        }

        @Test
        @DisplayName("Logout khi access token hết hạn (userId=null) → revoke + audit với null userId")
        void logout_expiredAccessToken_nullPrincipal_stillRevokesToken() {
            when(refreshTokenService.revokeRefreshToken(REFRESH_TOK)).thenReturn(true);
            authenticationService.logout(REFRESH_TOK, DEVICE_INFO, null, null);
            verify(refreshTokenService).revokeRefreshToken(REFRESH_TOK);

            ArgumentCaptor<AuditLogEvent> captor = ArgumentCaptor.forClass(AuditLogEvent.class);
            verify(eventPublisher).publishEvent(captor.capture());

            AuditLogEvent event = captor.getValue();
            assertThat(event.getActionType()).isEqualTo(AuditActionType.LOGOUT);
            assertThat(event.getResult()).isEqualTo(AuditResult.SUCCESS);
            assertThat(event.getUserId()).isNull();
        }

        @Test
        @DisplayName("Logout chỉ revoke 1 session — session khác không bị ảnh hưởng")
        void logout_revokesOnlyCurrentSession_notOtherSessions() {
            when(refreshTokenService.revokeRefreshToken(REFRESH_TOK)).thenReturn(true);
            authenticationService.logout(REFRESH_TOK, DEVICE_INFO, USER_ID, USERNAME);
            verify(refreshTokenService, never()).revokeAllUserTokens(any());
            verify(refreshTokenService, times(1)).revokeRefreshToken(REFRESH_TOK);
        }

        @Test
        @DisplayName("Audit failure không làm logout fail (fire-and-forget)")
        void logout_auditPublishFails_logoutStillSucceeds() {
            when(refreshTokenService.revokeRefreshToken(REFRESH_TOK)).thenReturn(true);
            doThrow(new RuntimeException("Audit queue full"))
                    .when(eventPublisher).publishEvent(any());
            authenticationService.logout(REFRESH_TOK, DEVICE_INFO, USER_ID, USERNAME);
            verify(refreshTokenService).revokeRefreshToken(REFRESH_TOK);
        }
    }

    @Nested
    @DisplayName("logoutAllDevices() — all sessions")
    class LogoutAllDevices {

        @Test
        @DisplayName("Logout tất cả devices → revokeAll + audit LOGOUT_ALL_DEVICES/SUCCESS")
        void logoutAllDevices_revokesAllTokens_auditsSuccess() {

            doNothing().when(refreshTokenService).revokeAllUserTokens(USER_ID);

            authenticationService.logoutAllDevices(USER_ID, USERNAME, DEVICE_INFO);

            verify(refreshTokenService).revokeAllUserTokens(USER_ID);

            ArgumentCaptor<AuditLogEvent> captor = ArgumentCaptor.forClass(AuditLogEvent.class);
            verify(eventPublisher).publishEvent(captor.capture());

            AuditLogEvent event = captor.getValue();
            assertThat(event.getActionType()).isEqualTo(AuditActionType.LOGOUT_ALL_DEVICES);
            assertThat(event.getResult()).isEqualTo(AuditResult.SUCCESS);
            assertThat(event.getUserId()).isEqualTo(USER_ID);
            assertThat(event.getMessage()).contains("all devices");
        }

        @Test
        @DisplayName("logoutAllDevices không gọi revokeRefreshToken (single-token method)")
        void logoutAllDevices_doesNotCallSingleRevoke() {
            doNothing().when(refreshTokenService).revokeAllUserTokens(USER_ID);

            authenticationService.logoutAllDevices(USER_ID, USERNAME, DEVICE_INFO);

            verify(refreshTokenService, never()).revokeRefreshToken(anyString());
        }
    }
}