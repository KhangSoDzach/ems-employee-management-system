package com.company.ems.backend.common.service;

import com.company.ems.backend.common.event.NotificationEvent;

/**
 * Placeholder interface for the in-app notification service.
 *
 * <p>When the WebSocket / SSE subsystem is implemented, provide a concrete
 * implementation annotated with {@code @Primary} or replace this stub.
 */
public interface NotificationService {

    /**
     * Sends (or queues) a notification to the recipient identified in the event.
     *
     * @param event the notification event to deliver
     */
    void send(NotificationEvent event);
}
