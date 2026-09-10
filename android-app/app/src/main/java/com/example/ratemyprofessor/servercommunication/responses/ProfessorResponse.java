package com.example.ratemyprofessor.servercommunication.responses;

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
