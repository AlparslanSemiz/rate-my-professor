package com.example.ratemyprofessor.logic;

import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;

import java.util.List;

/**
 * Calculates a weighted average of rating topics while excluding the overall category.
 */
public final class WeightedRatingCalc {

    /**
     * Calculates the category-weighted average, excluding entries in the overall category.
     *
     * @param ratings the category averages to combine; may be null or empty
     * @return the weighted average, -1 for null or empty input, or NaN if the total weight is zero
     */
    public static double calcRating(List<TopicAverageResponse> ratings) {
        if (ratings == null || ratings.isEmpty()) {
            return -1;
        }

        double ratingSum = 0;
        double sumWeights = 0;
        for (TopicAverageResponse rating : ratings) {
            if (rating.category().equals(RatingCategory.OVERALL)) {
                continue;
            }
            ratingSum += (rating.value() * rating.category().getDefaultWeight());
            sumWeights += rating.category().getDefaultWeight();
        }

        return ratingSum / sumWeights;
    }
}
