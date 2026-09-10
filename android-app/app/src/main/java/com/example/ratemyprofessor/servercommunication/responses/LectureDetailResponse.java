package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Contains the result of retrieving a single lecture offering.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param lecture the lecture offering data
 */
public record LectureDetailResponse(
        String message,
        boolean success,
        LectureResponse lecture
) {
}
