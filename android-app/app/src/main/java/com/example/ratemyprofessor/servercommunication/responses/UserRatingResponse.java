package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

/**
 * Contains the ratings submitted by the current user.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param ratings the ratings returned by the server
 */
public record UserRatingResponse(
        String message,
        boolean success,
        List<UserRatingDto> ratings
) {
}
