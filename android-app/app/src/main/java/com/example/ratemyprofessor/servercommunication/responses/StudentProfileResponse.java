package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Contains the student profile and contribution statistics returned by the server.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param username the student username
 * @param profilePicture the profile picture URL
 * @param averageRating the average rating
 * @param ratingsCount the number of ratings
 * @param commentsWritten the number of comments written by the student
 * @param credibilityScore the credibility score of the student
 */
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
