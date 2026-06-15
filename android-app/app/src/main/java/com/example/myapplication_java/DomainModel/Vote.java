package com.example.myapplication_java.DomainModel;

import java.util.Date;

public class Vote {
    public String voteId;
    public Date createdAt;
    public VoteType type;
    public Comment comment;

    public Vote (String voteId, Date createdAt, VoteType type, Comment comment) {
        this.voteId = voteId;
        this.createdAt = createdAt;
        this.type = type;
        this.comment = comment;
    }
}
