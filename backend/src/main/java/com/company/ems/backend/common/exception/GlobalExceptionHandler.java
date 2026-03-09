package com.company.ems.backend.common.exception;

import com.company.ems.backend.common.dto.ApiResponse;
import com.company.ems.backend.common.message.MessageCode;
import com.company.ems.backend.common.message.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

        private final MessageService messages;

        @ExceptionHandler(ForbiddenException.class)
        public ResponseEntity<ApiResponse<Void>> handleForbidden(
                ForbiddenException ex, WebRequest req) {
                log.warn("403 Forbidden: {}", req.getDescription(false));
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_FORBIDDEN)));
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiResponse<Void>> handleAccessDenied(
                AccessDeniedException ex, WebRequest req) {
                log.warn("403 Access Denied: {}", req.getDescription(false));
                String msg = ex.getMessage() != null && !ex.getMessage().isBlank()
                        ? ex.getMessage()
                        : messages.get(MessageCode.ERROR_FORBIDDEN);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(msg));
        }

        @ExceptionHandler(UnauthorizedException.class)
        public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
                UnauthorizedException ex, WebRequest req) {
                log.warn("401 Unauthorized: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(ex.getMessage()));
        }

        @ExceptionHandler(LockedException.class)
        public ResponseEntity<ApiResponse<Void>> handleLocked(
                LockedException ex, WebRequest req) {
                log.warn("401 Account Locked");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_ACCOUNT_LOCKED)));
        }

        @ExceptionHandler(DisabledException.class)
        public ResponseEntity<ApiResponse<Void>> handleDisabled(
                DisabledException ex, WebRequest req) {
                log.warn("401 Account Disabled");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_ACCOUNT_DISABLED)));
        }

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
                BadCredentialsException ex, WebRequest req) {
                log.warn("401 Bad Credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_BAD_CREDENTIALS)));
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiResponse<Void>> handleNotFound(
                ResourceNotFoundException ex, WebRequest req) {
                String msg = (ex.getResource() != null)
                        ? messages.get(MessageCode.COMMON_NOT_FOUND,
                        ex.getResource(), ex.getField(), ex.getValue())
                        : ex.getMessage();
                log.warn("404 Not Found: {}", msg);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(msg));
        }

        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ApiResponse<Void>> handleBusiness(
                BusinessException ex, WebRequest req) {
                log.warn("400 Business [{}]: {}", ex.getErrorCode(), ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(ex.getMessage()));
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalState(
                IllegalStateException ex, WebRequest req) {
                log.warn("400 Illegal State: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(ex.getMessage()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
                IllegalArgumentException ex, WebRequest req) {
                log.warn("400 Illegal Argument: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(ex.getMessage()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
                MethodArgumentNotValidException ex) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String field = ((FieldError) error).getField();
                        errors.put(field, error.getDefaultMessage());
                });
                log.warn("400 Validation failed: {}", errors);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.<Map<String, String>>builder()
                                .success(false)
                                .message(messages.get(MessageCode.ERROR_VALIDATION_FAILED))
                                .data(errors)
                                .build());
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ApiResponse<Void>> handleNotReadable(
                HttpMessageNotReadableException ex, WebRequest req) {
                log.warn("400 Message Not Readable: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_INVALID_REQUEST)));
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
                MethodArgumentTypeMismatchException ex, WebRequest req) {
                log.warn("400 Type Mismatch: param={} value={}", ex.getName(), ex.getValue());
                String msg = messages.get(MessageCode.ERROR_INVALID_PARAMETER,
                        ex.getName(), ex.getValue());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(msg));
        }

        @ExceptionHandler(MissingServletRequestParameterException.class)
        public ResponseEntity<ApiResponse<Void>> handleMissingParam(
                MissingServletRequestParameterException ex, WebRequest req) {
                log.warn("400 Missing Param: {}", ex.getParameterName());
                String msg = messages.get(MessageCode.ERROR_MISSING_PARAMETER,
                        ex.getParameterName());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error(msg));
        }

        @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
                HttpRequestMethodNotSupportedException ex, WebRequest req) {
                log.warn("405 Method Not Supported: {}", ex.getMethod());
                String msg = messages.get(MessageCode.ERROR_METHOD_NOT_SUPPORTED, ex.getMethod());
                return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                        .body(ApiResponse.error(msg));
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(
                DataIntegrityViolationException ex, WebRequest req) {
                log.error("409 Data Integrity: {}", ex.getMessage());
                String msg = ex.getMessage() != null && ex.getMessage().contains("Duplicate entry")
                        ? messages.get(MessageCode.ERROR_DUPLICATE_ENTRY)
                        : messages.get(MessageCode.ERROR_UNEXPECTED);
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error(msg));
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiResponse<Void>> handleGlobal(Exception ex, WebRequest req) {
                log.error("500 Unexpected at {}: {}", req.getDescription(false), ex.getMessage(), ex);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.error(messages.get(MessageCode.ERROR_UNEXPECTED)));
        }
}