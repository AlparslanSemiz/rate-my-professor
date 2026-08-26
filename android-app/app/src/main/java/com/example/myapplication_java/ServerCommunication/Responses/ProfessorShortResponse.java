package com.example.myapplication_java.ServerCommunication.Responses;

public record ProfessorShortResponse(
        String id,
        String firstName,
        String lastName,
        boolean active
) {
}
