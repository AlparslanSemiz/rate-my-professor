package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

/**
 * Contains the rating categories returned for a lecture offering.
 *
 * @param message the message returned by the server
 * @param success whether the server operation succeeded
 * @param categories the available rating categories
 */
public record RatingCategoriesResponse(
        String message,
        boolean success,
        List<RatingCategoryResponse> categories
) {}
