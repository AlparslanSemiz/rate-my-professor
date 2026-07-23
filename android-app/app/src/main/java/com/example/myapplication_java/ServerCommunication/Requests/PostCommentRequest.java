package com.example.myapplication_java.ServerCommunication.Requests;

public record PostCommentRequest (
    String lectureID,
    String content
) {}
