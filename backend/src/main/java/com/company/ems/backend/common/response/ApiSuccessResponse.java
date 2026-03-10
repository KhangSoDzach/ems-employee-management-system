package com.company.ems.backend.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiSuccessResponse<T> {
    private final Instant timestamp;
    private final String errorCode;
    private final String message;
    private final String path;
    private final String traceId;
    private final Map<String, String> fieldErrors;
    public static ApiErrorResponse of(
            int status, String errorCode, String message,
            String path, String traceId) {

        return ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status)
                .errorCode(errorCode)
                .message(message)
                .path(path)
                .traceId(traceId)
                .build();
    }

    public static ApiErrorResponse ofValidation(
            int status, String errorCode, String message,
            String path, String traceId,
            Map<String, String> fieldErrors) {

        return ApiErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status)
                .errorCode(errorCode)
                .message(message)
                .path(path)
                .traceId(traceId)
                .fieldErrors(fieldErrors)
                .build();
    }
}
