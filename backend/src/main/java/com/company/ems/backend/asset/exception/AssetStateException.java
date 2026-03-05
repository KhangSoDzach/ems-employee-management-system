package com.company.ems.backend.asset.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class AssetStateException extends RuntimeException {

    public AssetStateException(String message) {
        super(message);
    }
}
