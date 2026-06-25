package com.pse.moderation.dto.response;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String kitEmail,
        boolean admin,
        boolean blocked,
        int credibilityScore,
        int ratingsCount,
        int commentsWritten,
        int reportsReceived,
        int warnings
) {}
