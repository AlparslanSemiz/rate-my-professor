package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.Comment;

import java.util.List;

public record CommentsResponse (
    String message,
    boolean success,
    List<Comment> comments
) {}
