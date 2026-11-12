package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.Professor;

import java.util.List;

/**
 * Answer holding every professor the server knows. Used to refresh the local database.
 *
 * @param message    a human-readable explanation, mostly relevant when the request failed
 * @param success    whether the professors could be loaded
 * @param professors all professors
 */
public record ProfessorsResponse(
    String message,
    boolean success,
    List<Professor> professors
) {}
