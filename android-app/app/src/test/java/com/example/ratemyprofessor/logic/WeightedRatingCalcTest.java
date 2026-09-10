package com.example.ratemyprofessor.logic;

import static org.junit.Assert.assertEquals;

import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;

import org.junit.Test;

import java.util.List;

public class WeightedRatingCalcTest {

    @Test
    public void calcRatingUsesWeightsAndIgnoresOverall() {
        List<TopicAverageResponse> ratings = List.of(
                new TopicAverageResponse(RatingCategory.OVERALL, 1.0),
                new TopicAverageResponse(RatingCategory.ROOM, 4.0),
                new TopicAverageResponse(
                        RatingCategory.LECTURE_UNDERSTANDABILITY, 2.0
                )
        );

        double result = WeightedRatingCalc.calcRating(ratings);

        // (4.0 × 0.5 + 2.0 × 2.0) / (0.5 + 2.0) = 2.4
        assertEquals(2.4, result, 0.0001);
    }

    @Test
    public void calcRatingReturnsMinusOneForNull() {
        assertEquals(-1.0, WeightedRatingCalc.calcRating(null), 0.0);
    }

    @Test
    public void calcRatingReturnsMinusOneForEmptyList() {
        assertEquals(-1.0, WeightedRatingCalc.calcRating(List.of()), 0.0);
    }
}