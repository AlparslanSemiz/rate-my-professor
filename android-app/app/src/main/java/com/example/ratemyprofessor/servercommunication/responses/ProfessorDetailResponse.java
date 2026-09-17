package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Contains the result of retrieving details for one professor.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param professor the professor data
 */
public record ProfessorDetailResponse(
        String message,
        boolean success,
        ProfessorResponse professor
) {
}
