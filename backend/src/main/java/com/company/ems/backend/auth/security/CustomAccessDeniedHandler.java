package com.company.ems.backend.auth.security;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper   objectMapper;
    private final MessageService messages;

    @Override
    public void handle(
            HttpServletRequest    request,
            HttpServletResponse   response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {

        log.warn("403 Access Denied: path={} ex={}",
                request.getRequestURI(), accessDeniedException.getMessage());

        String message = messages.get(MessageCode.ERROR_FORBIDDEN);

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ApiResponse<Void> body = ApiResponse.error(message);
        objectMapper.writeValue(response.getWriter(), body);
    }
}