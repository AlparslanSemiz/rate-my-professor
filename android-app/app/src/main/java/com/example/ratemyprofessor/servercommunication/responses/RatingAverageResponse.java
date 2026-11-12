package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

/**
 * Answer holding the average rating of one lecture offering, split by topic.
 *
 * @param message a human-readable explanation, mostly relevant when the request failed
 * @param success whether the ratings could be loaded
 * @param ratings one average per rating topic; empty when nobody rated the offering yet
 */
public record RatingAverageResponse(
        String message,
        boolean success,
        List<TopicAverageResponse> ratings
) {}
