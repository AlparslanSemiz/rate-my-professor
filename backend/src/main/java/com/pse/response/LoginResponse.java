package com.pse.response;

public record LoginResponse(String message, boolean success, String authToken) {}
