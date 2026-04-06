package com.company.ems.backend.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Application event fired when a notification should be sent to one or more users.
 *
 * <p>Currently this is a placeholder — the event is published via
 * {@link org.springframework.context.ApplicationEventPublisher} but no listener
 * is wired up yet.  When the WebSocket / push-notification subsystem is implemented,
 * a {@code @EventListener} in that module can pick up these events without changing
 * the publishing code.
 *
 * <h3>Expected event types ({@code eventType} field)</h3>
 * <ul>
 *   <li>{@code ADJUSTMENT_REQUEST_SUBMITTED} — fires to the level-1 approver(s)
 *   <li>{@code ADJUSTMENT_REQUEST_APPROVED}  — fires to the employee
 *   <li>{@code ADJUSTMENT_REQUEST_REJECTED}  — fires to the employee
 *   <li>{@code ADJUSTMENT_REQUEST_RETURNED}  — fires to the employee
 *   <li>{@code ADJUSTMENT_REQUEST_PENDING_NEXT_LEVEL} — fires to the next approver(s)
 * </ul>
 */
@Getter
@Builder
@AllArgsConstructor
public class NotificationEvent {

    /** Logical event type identifier (see Javadoc above). */
    private final String eventType;

    /** User ID of the recipient. */
    private final Long recipientUserId;

    /** Optional body text for the notification message. */
    private final String message;

    /** Reference to the entity that triggered the event (e.g. adjustment request ID). */
    private final Long referenceId;

    /** Entity type label (e.g. "ATTENDANCE_ADJUSTMENT_REQUEST"). */
    private final String referenceType;
}
