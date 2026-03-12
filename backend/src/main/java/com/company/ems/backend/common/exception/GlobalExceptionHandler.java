package com.company.ems.backend.common.exception;

import com.company.ems.backend.common.audit.SecurityAuditService;
import com.company.ems.backend.common.enums.ErrorCode;
import com.company.ems.backend.common.message.MessageService;
import com.company.ems.backend.common.response.ApiErrorResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.naming.AuthenticationException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

        private final MessageService       messageService;
        private final SecurityAuditService auditService;

        @ExceptionHandler(AppException.class)
        public ResponseEntity<ApiErrorResponse> handleAppException(
                AppException ex, HttpServletRequest req) {

                ErrorCode code = ex.getErrorCode();
                log.warn("[{}] AppException code={} path={}", traceId(), code.name(), req.getRequestURI());

                return responseFromCode(code, req);
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiErrorResponse> handleBadCredentials(
                BadCredentialsException ex, HttpServletRequest req) {

                auditService.logAuthFailure(req);
                log.warn("[{}] Bad credentials path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.AUTH_INVALID_CREDENTIAL, req);
        }

        @ExceptionHandler(LockedException.class)
        public ResponseEntity<ApiErrorResponse> handleLocked(
                LockedException ex, HttpServletRequest req) {

                auditService.logAuthFailure(req);
                log.warn("[{}] Account locked path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.AUTH_ACCOUNT_LOCKED, req);
        }

        @ExceptionHandler(DisabledException.class)
        public ResponseEntity<ApiErrorResponse> handleDisabled(
                DisabledException ex, HttpServletRequest req) {

                auditService.logAuthFailure(req);
                log.warn("[{}] Account disabled path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.AUTH_ACCOUNT_DISABLED, req);
        }

        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiErrorResponse> handleAuthentication(
                AuthenticationException ex, HttpServletRequest req) {

                auditService.logAuthFailure(req);
                log.warn("[{}] AuthException={} path={}", traceId(),
                        ex.getClass().getSimpleName(), req.getRequestURI());
                return responseFromCode(ErrorCode.AUTH_UNAUTHORIZED, req);
        }

        @ExceptionHandler(ExpiredJwtException.class)
        public ResponseEntity<ApiErrorResponse> handleExpiredJwt(
                ExpiredJwtException ex, HttpServletRequest req) {

                auditService.logTokenExpired(req);
                log.warn("[{}] JWT expired path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.AUTH_TOKEN_EXPIRED, req);
        }

        @ExceptionHandler(JwtException.class)
        public ResponseEntity<ApiErrorResponse> handleJwt(
                JwtException ex, HttpServletRequest req) {

                auditService.logTokenInvalid(req);
                log.warn("[{}] JWT invalid={} path={}",
                        traceId(), ex.getClass().getSimpleName(), req.getRequestURI());
                return responseFromCode(ErrorCode.AUTH_TOKEN_INVALID, req);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAccessDenied(
                AccessDeniedException ex, HttpServletRequest req) {

                auditService.logAccessDenied(req);
                log.warn("[{}] Access denied path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.ACCESS_DENIED, req);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiErrorResponse> handleValidation(
                MethodArgumentNotValidException ex, HttpServletRequest req) {

                Map<String, String> fieldErrors = new HashMap<>();
                for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
                        fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
                }

                log.warn("[{}] Validation failed fields={} path={}",
                        traceId(), fieldErrors.keySet(), req.getRequestURI());

                ErrorCode code = ErrorCode.VALID_REQUEST_BODY;
                ApiErrorResponse body = ApiErrorResponse.ofValidation(
                        code.getStatusCode(), code.name(),
                        messageService.get(code),
                        req.getRequestURI(), traceId(), fieldErrors);

                return ResponseEntity.badRequest().body(body);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiErrorResponse> handleNotReadable(
                HttpMessageNotReadableException ex, HttpServletRequest req) {

                log.warn("[{}] Not readable path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.VALID_REQUEST_BODY, req);
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
                MethodArgumentTypeMismatchException ex, HttpServletRequest req) {

                log.warn("[{}] Type mismatch param={} value={} path={}",
                        traceId(), ex.getName(), ex.getValue(), req.getRequestURI());

                return responseFromCode(ErrorCode.VALID_PARAM_INVALID, req);
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ApiErrorResponse> handleMissingParam(
                MissingServletRequestParameterException ex, HttpServletRequest req) {

                log.warn("[{}] Missing param={} path={}", traceId(), ex.getParameterName(), req.getRequestURI());

                return responseFromCode(ErrorCode.VALID_PARAM_MISSING, req);
        }

        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(
                HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {

                log.warn("[{}] Method not allowed method={} path={}", traceId(), ex.getMethod(), req.getRequestURI());

                return responseFromCode(ErrorCode.VALID_METHOD_NOT_ALLOWED, req);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleDataIntegrity(
                DataIntegrityViolationException ex, HttpServletRequest req) {

                log.error("[{}] Data integrity path={}", traceId(), req.getRequestURI());
                return responseFromCode(ErrorCode.RESOURCE_CONFLICT, req);
        }

        // ── Business / Domain exceptions ─────────────────────────────────────────────

        /**
         * Handles {@link BusinessException} thrown when a business rule is violated
         * (e.g. duplicate email, duplicate national ID).
         * Returns HTTP 409 Conflict with the business error code and message.
         */
        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ApiErrorResponse> handleBusiness(
                BusinessException ex, HttpServletRequest req) {

                log.warn("[{}] Business rule violation code={} path={}: {}",
                        traceId(), ex.getErrorCode(), req.getRequestURI(), ex.getMessage());

                ApiErrorResponse body = ApiErrorResponse.of(
                        HttpStatus.CONFLICT.value(),
                        ex.getErrorCode(),
                        ex.getMessage(),
                        req.getRequestURI(),
                        traceId());

                return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        }

        /**
         * Handles {@link ResourceNotFoundException} when entity lookup fails.
         * Returns HTTP 404 Not Found.
         */
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleNotFound(
                ResourceNotFoundException ex, HttpServletRequest req) {

                log.warn("[{}] Resource not found path={}: {}",
                        traceId(), req.getRequestURI(), ex.getMessage());

                return responseFromCode(ErrorCode.RESOURCE_NOT_FOUND, req);
        }

        /**
         * Handles {@link ForbiddenException} for data-scope access violations.
         * Returns HTTP 403 Forbidden.
         */
        @ExceptionHandler(ForbiddenException.class)
        public ResponseEntity<ApiErrorResponse> handleForbidden(
                ForbiddenException ex, HttpServletRequest req) {

                log.warn("[{}] Forbidden path={}: {}",
                        traceId(), req.getRequestURI(), ex.getMessage());

                return responseFromCode(ErrorCode.ACCESS_DENIED, req);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiErrorResponse> handleAll(Exception ex, HttpServletRequest req) {

                log.error("[{}] Unexpected error path={}: {}",
                        traceId(), req.getRequestURI(), ex.getMessage(), ex);
                return responseFromCode(ErrorCode.INTERNAL_ERROR, req);
        }

        private ResponseEntity<ApiErrorResponse> responseFromCode(
                ErrorCode code, HttpServletRequest req) {

                return response(code.getHttpStatus(), code,
                        messageService.get(code), req);
        }

        private ResponseEntity<ApiErrorResponse> response(
                HttpStatus status, ErrorCode code, String message, HttpServletRequest req) {

                ApiErrorResponse body = ApiErrorResponse.of(
                        status.value(), code.name(), message, req.getRequestURI(), traceId());

                return ResponseEntity.status(status).body(body);
        }

        private String traceId() {
                String id = MDC.get("traceId");
                return id != null ? id : UUID.randomUUID().toString();
        }
}