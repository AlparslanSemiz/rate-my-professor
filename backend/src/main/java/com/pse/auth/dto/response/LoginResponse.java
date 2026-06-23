package com.pse.auth.dto.response;

public record LoginResponse(String message, boolean success, String authToken) {}
