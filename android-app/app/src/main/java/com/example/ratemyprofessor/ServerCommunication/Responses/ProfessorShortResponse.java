package com.example.ratemyprofessor.ServerCommunication.Responses;

public record ProfessorShortResponse(
        String id,
        String firstName,
        String lastName,
        boolean active
) {
}
