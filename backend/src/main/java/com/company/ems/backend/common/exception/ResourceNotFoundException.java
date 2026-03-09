package com.company.ems.backend.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@Getter
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private final String resource;
    private final String field;
    private final Object value;

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(resource + " not found with " + field + ": " + value);
        this.resource = resource;
        this.field    = field;
        this.value    = value;
    }

    public ResourceNotFoundException(String message) {
        super(message);
        this.resource = null;
        this.field    = null;
        this.value    = null;
    }
}