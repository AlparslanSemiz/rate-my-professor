package com.example.ratemyprofessor.ServerCommunication.Responses;

import java.util.List;

public record UserRatingResponse(
        String message,
        boolean success,
        List<UserRatingDto> ratings
) {
}
