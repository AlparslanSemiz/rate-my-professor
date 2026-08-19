package com.pse.shared.error;

import org.springframework.http.HttpStatus;

public class RateLimitException extends ApiException {

    private final long retryAfterSeconds;

    public RateLimitException(long retryAfterSeconds) {
        super(HttpStatus.TOO_MANY_REQUESTS, "Too many requests");
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
