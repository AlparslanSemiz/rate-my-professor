package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.Lecture;

import java.util.List;

public class LecturesResponse {
    public String message;
    public boolean success;
    public List<Lecture> lectures;
}
