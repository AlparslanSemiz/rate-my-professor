package com.example.myapplication_java.DomainModel;

public class User {
    public String userId;
    public String kitEmail;
    public String kitUserCode;
    public String displayName;
    public String profileImagePath;

    public User(String userId, String kitEmail, String kitUserCode, String displayName, String profileImagePath) {
        this.userId = userId;
        this.kitEmail = kitEmail;
        this.kitUserCode = kitUserCode;
        this.displayName = displayName;
        this.profileImagePath = profileImagePath;
    }

    //TODO: Implement the following methods.
    public void createReview(Review review) {

    }

    public void writeComment(Comment comment) {}

    public void voteComment(Comment comment, VoteType voteType) {}
}
