package com.example.myapplication_java.ServerCommunication;

import com.example.myapplication_java.DomainModel.Professor;

import java.util.List;

public class ProfessorResponse {
    public String message;
    public boolean success;
    public List<Professor> professors;
}
