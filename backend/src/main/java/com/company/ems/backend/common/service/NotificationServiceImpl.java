package com.company.ems.backend.common.service;

import com.company.ems.backend.common.event.NotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * No-op (log-only) implementation of {@link NotificationService}.
 *
 * <p>Replace or extend this when WebSocket / push notifications are wired up.
 * The log output can be used to verify that notification events are being triggered
 * correctly during development and testing.
 */
@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Override
    public void send(NotificationEvent event) {
        log.info("[NOTIFICATION PLACEHOLDER] type={}, recipient=userId:{}, ref={}#{}, message={}",
                event.getEventType(),
                event.getRecipientUserId(),
                event.getReferenceType(),
                event.getReferenceId(),
                event.getMessage());
    }
}
