package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Contains the user profile and personal contribution statistics returned by the server.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param username the student username
 * @param profilePicture the profile picture URL
 * @param averageRating the average rating
 * @param ratingCount the number of ratings
 * @param writtencomments the number of comments written by the student
 * @param credibilityScore the credibility score of the student
 */
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
