package com.example.ratemyprofessor.ServerCommunication.Requests;

import java.util.List;

public record RatingRequest(
        String lectureId,
        List<RatingTopicRequest> topics
) {}