package com.example.myapplication_java.ServerCommunication;

import java.time.LocalDateTime;

public class AnswerResponse {
    public String commentId;
    public String content;
    public ContentStatus status;
    public String studentUsername;
    public LocalDateTime createdAt;
}
