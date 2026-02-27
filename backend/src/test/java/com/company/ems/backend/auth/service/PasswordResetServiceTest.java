package com.company.ems.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.company.ems.backend.auth.config.PasswordResetProperties;
import com.company.ems.backend.auth.entity.PasswordResetToken;
import com.company.ems.backend.auth.port.out.EmailPort;
import com.company.ems.backend.auth.repository.PasswordResetTokenRepository;
import com.company.ems.backend.common.exception.BusinessException;
import com.company.ems.backend.user.entity.User;
import com.company.ems.backend.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordResetService – Unit Tests")
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository tokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailPort emailPort;

    private PasswordResetProperties properties;

    @InjectMocks
    private PasswordResetService service;

    private User mockUser;

    @BeforeEach
    void setUp() {
        properties = new PasswordResetProperties();
        properties.setOtpExpiryMinutes(5);
        properties.setResendCooldownSeconds(60);

        // Re-create service with the real properties object (not a mock)
        service = new PasswordResetService(userRepository, tokenRepository, passwordEncoder, emailPort, properties);

        mockUser = User.builder()
                .username("johndoe")
                .email("john@company.com")
                .password("hashed-old-password")
                .enabled(true)
                .build();
        // Simulate an ID for cross-user attack check
        mockUser.setId(null); // BaseEntity id is null in unit tests without JPA
    }

    // ──────────────────────────────────────────────────────────
    // initiatePasswordReset
    // ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should send OTP email when email exists")
    void shouldSendOtpEmail_whenUserEmailExists() {
        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(mockUser));
        when(tokenRepository.findActiveTokensByUser(mockUser)).thenReturn(Collections.emptyList());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenAnswer(i -> i.getArgument(0));

        service.initiatePasswordReset("john@company.com");

        // Verify OTP email was sent
        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailPort).sendPasswordResetOtp(emailCaptor.capture(), otpCaptor.capture());

        assertThat(emailCaptor.getValue()).isEqualTo("john@company.com");
        assertThat(otpCaptor.getValue()).matches("\\d{6}"); // exactly 6 digits
    }

    @Test
    @DisplayName("Should NOT throw when email does not exist (anti-enumeration)")
    void shouldNotThrow_whenEmailNotFound() {
        when(userRepository.findByEmail("nonexistent@company.com")).thenReturn(Optional.empty());

        // Must return silently without throwing
        service.initiatePasswordReset("nonexistent@company.com");

        verify(emailPort, never()).sendPasswordResetOtp(anyString(), anyString());
        verify(tokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw BusinessException when resend cooldown is active")
    void shouldThrowOnResend_whenWithinCooldown() {
        // Active token created 10 seconds ago (< 60s cooldown)
        PasswordResetToken recentToken = PasswordResetToken.builder()
                .user(mockUser)
                .otpHash("somehash")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        recentToken.setCreatedAt(LocalDateTime.now().minusSeconds(10));

        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(mockUser));
        when(tokenRepository.findActiveTokensByUser(mockUser)).thenReturn(List.of(recentToken));

        assertThatThrownBy(() -> service.initiatePasswordReset("john@company.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Vui lòng đợi");

        verify(emailPort, never()).sendPasswordResetOtp(anyString(), anyString());
    }

    // ──────────────────────────────────────────────────────────
    // resetPassword
    // ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Should reset password successfully when OTP is valid")
    void shouldResetPassword_whenOtpValid() {
        String rawOtp = "123456";

        // Build an active (non-expired, non-consumed) token for the valid OTP hash
        // We compute the same hash the service would compute
        String otpHash = computeTestHash(rawOtp);
        PasswordResetToken validToken = PasswordResetToken.builder()
                .user(mockUser)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(mockUser));
        when(tokenRepository.findActiveByOtpHash(otpHash)).thenReturn(Optional.of(validToken));
        when(passwordEncoder.encode("NewPass123")).thenReturn("hashed-new-password");
        when(tokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.resetPassword("john@company.com", rawOtp, "NewPass123");

        assertThat(validToken.isConsumed()).isTrue();
        verify(userRepository).save(mockUser);
        verify(passwordEncoder).encode("NewPass123");
    }

    @Test
    @DisplayName("Should throw BusinessException when OTP is expired")
    void shouldThrow_whenOtpExpired() {
        String rawOtp = "999999";
        String otpHash = computeTestHash(rawOtp);
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .user(mockUser)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // already expired
                .build();

        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(mockUser));
        when(tokenRepository.findActiveByOtpHash(otpHash)).thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> service.resetPassword("john@company.com", rawOtp, "NewPass123"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("hết hạn");
    }

    @Test
    @DisplayName("Should throw BusinessException when OTP hash not found")
    void shouldThrow_whenOtpNotFound() {
        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(mockUser));
        when(tokenRepository.findActiveByOtpHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resetPassword("john@company.com", "000000", "NewPass123"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("Should throw BusinessException when OTP already consumed")
    void shouldThrow_whenOtpAlreadyUsed() {
        String rawOtp = "777777";
        String otpHash = computeTestHash(rawOtp);
        PasswordResetToken usedToken = PasswordResetToken.builder()
                .user(mockUser)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(true) // already consumed
                .build();

        when(userRepository.findByEmail("john@company.com")).thenReturn(Optional.of(mockUser));
        when(tokenRepository.findActiveByOtpHash(otpHash)).thenReturn(Optional.of(usedToken));

        assertThatThrownBy(() -> service.resetPassword("john@company.com", rawOtp, "NewPass123"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("Should throw BusinessException when email not found on reset")
    void shouldThrow_whenEmailNotFoundOnReset() {
        when(userRepository.findByEmail("ghost@company.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resetPassword("ghost@company.com", "123456", "NewPass123"))
                .isInstanceOf(BusinessException.class);
    }

    // ──────────────────────────────────────────────────────────
    // Test helper – mirrors the service's private hashOtp method
    // ──────────────────────────────────────────────────────────

    private String computeTestHash(String otp) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
