package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.RatingCategory;

/**
 * Describes a rating category with its display label and default weight.
 *
 * @param category the rating category
 * @param displayName the label shown to the user
 * @param defaultWeight the weight used when calculating an aggregate rating
 */
public record RatingCategoryResponse(
        RatingCategory category,
        String displayName,
        double defaultWeight
) {}
