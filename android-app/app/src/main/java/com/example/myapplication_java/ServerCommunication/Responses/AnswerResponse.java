package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;

public record AnswerResponse (
    String commentId,
    String content,
    ContentStatus status,
    String studentUsername,
    LocalDateTime createdAt
) {}
