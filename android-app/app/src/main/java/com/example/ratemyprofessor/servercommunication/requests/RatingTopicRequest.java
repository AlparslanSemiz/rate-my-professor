package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.domain.RatingCategory;

/**
 * Contains a score for one rating category.
 *
 * @param category the rating category
 * @param value the rating value
 */
public record RatingTopicRequest (

    RatingCategory category,
    double value
) {}
