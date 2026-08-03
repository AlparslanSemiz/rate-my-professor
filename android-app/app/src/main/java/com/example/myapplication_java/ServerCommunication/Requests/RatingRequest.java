package com.example.myapplication_java.ServerCommunication.Requests;

import java.util.List;

public record RatingRequest(
        String lectureId,
        List<RatingTopicRequest> topics
) {}