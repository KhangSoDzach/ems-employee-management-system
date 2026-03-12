package com.company.ems.backend.employee.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.company.ems.backend.auth.port.out.EmailPort;

/**
 * Unit tests for {@link EmployeeEmailNotificationService}.
 *
 * <p>Verifies:
 * <ul>
 *   <li>Successful dispatch delegates to {@link EmailPort}</li>
 *   <li>Email-delivery failures are caught and logged — never propagated</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class EmployeeEmailNotificationServiceTest {

    @Mock
    private EmailPort emailPort;

    @InjectMocks
    private EmployeeEmailNotificationService notificationService;

    // ── Happy path ────────────────────────────────────────────────────────────

    @Test
    void notifyNewEmployeeAsync_ShouldCallEmailPort_WithCorrectArgs() {
        // Given
        String email    = "jane.doe@example.com";
        String fullName = "Jane Doe";
        String username = "IT202600001";
        String rawPass  = "IT202600001110299";

        doNothing().when(emailPort).sendAccountCredentialsEmail(email, fullName, username, rawPass);

        // When
        notificationService.notifyNewEmployeeAsync(email, fullName, username, rawPass);

        // Then
        verify(emailPort, times(1)).sendAccountCredentialsEmail(email, fullName, username, rawPass);
    }

    // ── Resilience: email failure must NOT propagate ──────────────────────────

    @Test
    void notifyNewEmployeeAsync_ShouldNotPropagateException_WhenEmailPortFails() {
        // Given
        doThrow(new RuntimeException("SMTP server unreachable"))
                .when(emailPort).sendAccountCredentialsEmail(anyString(), anyString(), anyString(), anyString());

        // When / Then — must NOT throw
        assertDoesNotThrow(() ->
                notificationService.notifyNewEmployeeAsync(
                        "jane.doe@example.com", "Jane Doe", "IT202600001", "IT202600001110299"));

        verify(emailPort, times(1))
                .sendAccountCredentialsEmail(anyString(), anyString(), anyString(), anyString());
    }
}
