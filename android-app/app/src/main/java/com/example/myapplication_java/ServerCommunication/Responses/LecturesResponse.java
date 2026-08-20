package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.Lecture;

import java.util.List;

/**
 * Answer holding every lecture the server knows. Used to refresh the local database.
 *
 * @param message  a human-readable explanation, mostly relevant when the request failed
 * @param success  whether the lectures could be loaded
 * @param lectures all lectures, one entry per lecture and semester
 */
public record LecturesResponse (
     String message,
     boolean success,
     List<Lecture> lectures
){}
