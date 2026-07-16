package com.example.myapplication_java.DomainModel;

import com.example.myapplication_java.ServerCommunication.Responses.AnswerResponse;
import com.example.myapplication_java.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;
import java.util.List;

public record Comment (
    String content,
    ContentStatus status,
    String studentUsername,
    String lectureID,
    LocalDateTime createdAt,
    List<AnswerResponse> answers
) {}
