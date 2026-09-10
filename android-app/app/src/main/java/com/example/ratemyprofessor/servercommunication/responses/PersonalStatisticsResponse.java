package com.example.ratemyprofessor.servercommunication.responses;

public record PersonalStatisticsResponse(
        String message,
        boolean success,
        String username,
        String profilePicture,
        float averageRating,
        int ratingCount,
        int writtencomments,
        int credibilityScore
) {
}
