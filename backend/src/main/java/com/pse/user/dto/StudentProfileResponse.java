package com.pse.user.dto;

public record StudentProfileResponse(
        String message,
        boolean success,
        String username,
        String profilePicture,
        double averageRating,
        int ratingsCount,
        int commentsWritten,
        int credibilityScore
) {}