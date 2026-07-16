package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.Professor;

import java.util.List;

public record ProfessorResponse (
    String message,
    boolean success,
    List<Professor> professors
) {}
