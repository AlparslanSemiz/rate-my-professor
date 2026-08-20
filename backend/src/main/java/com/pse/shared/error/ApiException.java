package com.pse.shared.error;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    /**
     * @param code a stable, machine-readable reason the caller can branch on, for the cases
     *             where a human-readable message is not enough — a refused revert has several
     *             distinct causes and the panel has to tell the operator which one it hit.
     *             Null for the ordinary errors, and then omitted from the response entirely.
     */
    public ApiException(HttpStatus status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
