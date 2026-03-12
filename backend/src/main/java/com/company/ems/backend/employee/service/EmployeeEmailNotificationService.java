package com.company.ems.backend.employee.service;

import com.company.ems.backend.auth.port.out.EmailPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Application-layer service responsible for sending email notifications
 * related to the Employee bounded context.
 *
 * <p>This service acts as an anti-corruption layer between the Employee
 * context and the {@link EmailPort} output port (which lives in the Auth
 * context's infrastructure). Keeping this wrapper here avoids introducing
 * a cross-context dependency directly inside {@link EmployeeServiceImpl}.
 *
 * <p>All methods in this service are annotated with {@code @Async} so they
 * run on a separate thread pool and never block the employee-creation
 * transaction. If email delivery fails, the exception is caught and logged
 * but <strong>never propagated</strong> — a mail-delivery failure must not
 * roll back a successfully persisted employee record.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeEmailNotificationService {

    private final EmailPort emailPort;

    /**
     * Sends account credentials to the newly created employee asynchronously.
     *
     * <p>Runs on the {@code taskExecutor} thread pool (configured in
     * {@code AsyncConfig}). Any exception from the mail infrastructure is
     * swallowed after logging so that the calling transaction is unaffected.
     *
     * @param toEmail     HR-registered email address of the new employee
     * @param fullName    employee's full name for email personalisation
     * @param username    login username — the auto-generated employee code
     * @param rawPassword auto-generated default password (employeeCode + DOB as ddMMyy)
     */
    @Async("taskExecutor")
    public void notifyNewEmployeeAsync(String toEmail, String fullName,
                                       String username, String rawPassword) {
        try {
            emailPort.sendAccountCredentialsEmail(toEmail, fullName, username, rawPassword);
            log.info("[EMS-EMAIL] Credentials notification dispatched for employee [username={}] to [{}]",
                    username, toEmail);
        } catch (Exception e) {
            // IMPORTANT: We intentionally catch all exceptions here.
            // A mail-delivery failure must never affect the employee-creation outcome.
            log.error("[EMS-EMAIL] Failed to send credentials email to [{}] for employee [username={}]: {}",
                    toEmail, username, e.getMessage(), e);
        }
    }
}
