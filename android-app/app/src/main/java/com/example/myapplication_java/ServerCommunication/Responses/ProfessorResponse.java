package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.Professor;

import java.util.List;

/**
 * Answer holding every professor the server knows. Used to refresh the local database.
 *
 * @param message    a human readable explanation, mostly relevant when the request failed
 * @param success    whether the professors could be loaded
 * @param professors all professors
 */
public record ProfessorResponse (
    String message,
    boolean success,
    List<Professor> professors
) {}
