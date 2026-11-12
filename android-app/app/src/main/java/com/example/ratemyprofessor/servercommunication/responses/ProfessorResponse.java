package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

/**
 * Describes a professor and the associated lectures and rating statistics.
 *
 * @param id the unique identifier
 * @param firstName the first name of the professor
 * @param lastName the last name of the professor
 * @param active whether the entry is active
 * @param averageRating the average rating
 * @param ratingCount the number of ratings
 * @param lectureIds the identifiers of the lectures associated with the professor
 */
public record ProfessorResponse(
        String id,
        String firstName,
        String lastName,
        boolean active,
        double averageRating,
        int ratingCount,
        List<String> lectureIds
) {
}
