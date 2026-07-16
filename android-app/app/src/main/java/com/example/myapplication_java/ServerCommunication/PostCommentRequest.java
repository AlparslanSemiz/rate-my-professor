package com.example.myapplication_java.ServerCommunication;

public record PostCommentRequest (
    String lectureID,
    String content
) {}
