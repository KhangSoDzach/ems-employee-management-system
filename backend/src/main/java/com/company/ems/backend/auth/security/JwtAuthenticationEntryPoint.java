package com.company.ems.backend.auth.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.company.ems.backend.common.constant.AppConstant;
import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.company.ems.backend.common.audit.SecurityAuditService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper        objectMapper;
    private final MessageService      messages;
    private final SecurityAuditService auditService;

    @Override
    public void commence(
            HttpServletRequest      request,
            HttpServletResponse     response,
            AuthenticationException authException) throws IOException, ServletException {

        MessageCode errorCode = resolveErrorCode(request);
        log.warn("401 Unauthorized [{}]: path={}", errorCode.name(), request.getRequestURI());

        switch (errorCode) {
            case ERROR_TOKEN_EXPIRED -> auditService.logTokenExpired(request);
            case ERROR_TOKEN_INVALID -> auditService.logTokenInvalid(request);
            case ERROR_UNAUTHORIZED -> auditService.logAuthFailure(request);
            default -> auditService.logAuthFailure(request);
        }

        String message = messages.get(errorCode);

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(response.getWriter(), ApiResponse.error(message));
    }

    private MessageCode resolveErrorCode(HttpServletRequest request) {
        Object attr = request.getAttribute(AppConstant.JWT_ERROR_CODE_ATTR);
        if (attr instanceof MessageCode code) {
            return code;
        }
        return MessageCode.ERROR_UNAUTHORIZED;
    }
}