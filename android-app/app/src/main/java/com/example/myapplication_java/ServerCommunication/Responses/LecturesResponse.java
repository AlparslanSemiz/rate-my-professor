package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.Lecture;

import java.util.List;

public record LecturesResponse (
     String message,
     boolean success,
     List<Lecture> lectures
){}
