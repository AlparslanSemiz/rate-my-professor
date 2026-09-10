package com.example.ratemyprofessor.logic;

import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;

import java.util.List;

public final class WeightedRatingCalc {

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
