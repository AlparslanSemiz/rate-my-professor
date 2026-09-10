package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.LectureModel;

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
     List<LectureModel> lectures
){}
