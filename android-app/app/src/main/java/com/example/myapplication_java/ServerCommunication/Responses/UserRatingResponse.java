package com.example.myapplication_java.ServerCommunication.Responses;

import java.util.List;

public record UserRatingResponse(
        String message,
        boolean success,
        List<UserRatingDto> ratings
) {
}
