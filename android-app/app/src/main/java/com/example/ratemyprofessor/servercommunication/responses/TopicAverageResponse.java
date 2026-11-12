package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.RatingCategory;

/**
 * The average rating of a single topic, for example "Clarity".
 *
 * @param category  the rating category
 * @param value the average of all ratings given for this topic, on a scale from 0.0 to 5.0
 */
public record TopicAverageResponse(
        RatingCategory category,
        double value
) {}
