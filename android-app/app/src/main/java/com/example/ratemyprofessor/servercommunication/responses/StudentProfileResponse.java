package com.example.ratemyprofessor.servercommunication.responses;

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
