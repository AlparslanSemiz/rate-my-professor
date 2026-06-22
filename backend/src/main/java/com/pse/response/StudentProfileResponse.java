package com.pse.response;

public record StudentProfileResponse(
        String message,
        boolean success,
        String username,
        int credibilityScore,
        int commentsWritten,
        int ratingsCount
) {}