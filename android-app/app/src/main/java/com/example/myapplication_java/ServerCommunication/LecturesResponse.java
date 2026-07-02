package com.example.myapplication_java.ServerCommunication;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;

import java.util.List;

public class LecturesResponse {
    public String message;
    public boolean success;
    public List<Lecture> lectures;
}
