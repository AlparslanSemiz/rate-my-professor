package com.example.ratemyprofessor.servercommunication.requests;

import java.util.List;

public record RatingRequest(
        String lectureId,
        List<RatingTopicRequest> topics
) {}