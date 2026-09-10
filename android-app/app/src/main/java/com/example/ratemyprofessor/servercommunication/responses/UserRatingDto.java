package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Associates a lecture offering with the overall rating submitted by the user.
 *
 * @param lecture the lecture offering data
 * @param overallRating the overall rating given by the user
 */
public record UserRatingDto(
        LectureResponse lecture,
        double overallRating
) {
}
