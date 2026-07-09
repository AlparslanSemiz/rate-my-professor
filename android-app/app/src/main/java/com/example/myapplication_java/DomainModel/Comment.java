package com.example.myapplication_java.DomainModel;

import com.example.myapplication_java.ServerCommunication.AnswerResponse;
import com.example.myapplication_java.ServerCommunication.ContentStatus;

import java.time.LocalDateTime;
import java.util.List;

public class Comment {
    public String content;
    public ContentStatus status;
    public String studentUsername;
    public String lectureID;
    public LocalDateTime createdAt;
    public List<AnswerResponse> answers;
}
