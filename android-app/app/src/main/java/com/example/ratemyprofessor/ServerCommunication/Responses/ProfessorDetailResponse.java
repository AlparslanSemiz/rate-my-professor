package com.example.ratemyprofessor.ServerCommunication.Responses;

public record ProfessorDetailResponse(
        String message,
        boolean success,
        ProfessorResponse professor
) {
}
