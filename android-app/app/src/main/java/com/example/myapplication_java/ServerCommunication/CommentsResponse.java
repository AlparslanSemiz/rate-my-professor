package com.example.myapplication_java.ServerCommunication;

import com.example.myapplication_java.DomainModel.Comment;

import java.util.List;

public class CommentsResponse {
    public String message;
    public boolean success;
    public List<Comment> comments;
}
