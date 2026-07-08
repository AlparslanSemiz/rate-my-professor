package com.example.myapplication_java.ServerCommunication.Responses;

import java.util.List;

public record RatingAverageResponse(
        String message,
        boolean success,
        List<TopicAverageResponse> ratings
) {}
