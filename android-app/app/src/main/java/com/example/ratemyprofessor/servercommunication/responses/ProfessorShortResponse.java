package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Contains the identifying details and active status of a professor.
 *
 * @param id the unique identifier
 * @param firstName the first name of the professor
 * @param lastName the last name of the professor
 * @param active whether the entry is active
 */
public record ProfessorShortResponse(
        String id,
        String firstName,
        String lastName,
        boolean active
) {
}
