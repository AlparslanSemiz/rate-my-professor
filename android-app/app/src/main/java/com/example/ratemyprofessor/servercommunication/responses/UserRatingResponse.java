package com.example.ratemyprofessor.servercommunication.responses;

import java.util.List;

public record UserRatingResponse(
        String message,
        boolean success,
        List<UserRatingDto> ratings
) {
}
