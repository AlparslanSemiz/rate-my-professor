package com.example.myapplication_java.ServerCommunication;

public class PostCommentRequest {
    public String lectureID;
    public String content;
    public PostCommentRequest(String lectureID, String content) {
        this.lectureID = lectureID;
        this.content = content;
    }
}
