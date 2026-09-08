package com.example.ratemyprofessor.ServerCommunication.Responses;

import java.util.List;

public record ProfessorResponse(
        String id,
        String firstName,
        String lastName,
        boolean active,
        double averageRating,
        int ratingCount,
        List<String> lectureIds
) {
}
