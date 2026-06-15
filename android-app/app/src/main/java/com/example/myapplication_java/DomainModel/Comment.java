package com.example.myapplication_java.DomainModel;

import java.util.Date;

public class Comment {
    public String commentId;
    public String text;
    public Date createdAt;
    public Date updatedAt;

    public Comment(String commentId, String text, Date createdAt, Date updatedAt) {
        this.commentId = commentId;
        this.text = text;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    //TODO: Implement the following methods.
    public void addReply(Comment reply) {}

    public int getVoteScore() {
        return 0;
    }

}
