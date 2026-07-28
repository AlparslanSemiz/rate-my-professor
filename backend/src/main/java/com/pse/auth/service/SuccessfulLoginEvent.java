package com.pse.auth.service;

public record SuccessfulLoginEvent(String email, String ipAddress, String userAgent) {
}
