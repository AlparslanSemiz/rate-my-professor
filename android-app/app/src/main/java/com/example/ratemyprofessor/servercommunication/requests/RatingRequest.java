package com.example.ratemyprofessor.servercommunication.requests;

import java.util.List;

/**
 * Contains the category ratings submitted for a lecture offering.
 *
 * @param lectureId the identifier of the lecture offering
 * @param topics the category scores to submit
 */
public record RatingRequest(
        String lectureId,
        List<RatingTopicRequest> topics
) {}