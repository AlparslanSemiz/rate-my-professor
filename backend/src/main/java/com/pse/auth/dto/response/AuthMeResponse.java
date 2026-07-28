package com.pse.auth.dto.response;

public record AuthMeResponse(
        String message,
        boolean success,
        AuthUserResponse user
) {
}
