package com.pse.auth.dto.response;

/**
 * Answer of a successful login. {@code expiresAt} is the moment the returned token
 * stops authenticating, as a UTC ISO 8601 timestamp. It is served because the two APIs
 * hand out sessions of very different lengths and a client cannot know which it got.
 */
public record LoginResponse(String message, boolean success, String authToken, String expiresAt) {}
