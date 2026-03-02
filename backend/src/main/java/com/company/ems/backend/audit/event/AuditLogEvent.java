package com.company.ems.backend.audit.event;

import com.company.ems.backend.audit.enums.AuditActionType;
import com.company.ems.backend.audit.enums.AuditResult;
import com.company.ems.backend.audit.enums.LoginMethod;
import lombok.Builder;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AuditLogEvent extends ApplicationEvent {

    private final Long   userId;
    private final String identifierAttempted;
    private final AuditActionType actionType;
    private final AuditResult     result;
    private final LoginMethod     loginMethod;
    private final String ipAddress;
    private final String userAgent;
    private final String clientType;
    private final String correlationId;
    private final String message;
    @Builder
    public AuditLogEvent(
            Object source,
            Long userId,
            String identifierAttempted,
            AuditActionType actionType,
            AuditResult result,
            LoginMethod loginMethod,
            String ipAddress,
            String userAgent,
            String clientType,
            String correlationId,
            String message) {
        super(source);
        this.userId               = userId;
        this.identifierAttempted  = identifierAttempted;
        this.actionType           = actionType;
        this.result               = result;
        this.loginMethod          = loginMethod != null ? loginMethod : LoginMethod.JWT;
        this.ipAddress            = ipAddress;
        this.userAgent            = userAgent;
        this.clientType           = clientType;
        this.correlationId        = correlationId;
        this.message              = message;
    }
}