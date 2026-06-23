package com.pse.user.dto;

public record StudentProfileResponse(
        String message,
        boolean success,
        String username,
        double averageRating,
        int ratingsCount,
        int commentsWritten,
        int credibilityScore
) {}