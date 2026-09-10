package com.example.ratemyprofessor.servercommunication.responses;

public record ProfessorDetailResponse(
        String message,
        boolean success,
        ProfessorResponse professor
) {
}
