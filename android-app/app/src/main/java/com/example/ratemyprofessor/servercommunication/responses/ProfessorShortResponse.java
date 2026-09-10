package com.example.ratemyprofessor.servercommunication.responses;

public record ProfessorShortResponse(
        String id,
        String firstName,
        String lastName,
        boolean active
) {
}
