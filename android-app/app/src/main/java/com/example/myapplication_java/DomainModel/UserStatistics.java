package com.example.myapplication_java.DomainModel;

public class UserStatistics {
    public int reviewCount;
    public int commentCount;
    public double upvoteDownvoteRatio;
    public double averageGivenGrade;

    public UserStatistics(int reviewCount, int commentCount, double upvoteDownvoteRatio, double averageGivenGrade) {
        this.reviewCount = reviewCount;
        this.commentCount = commentCount;
        this.upvoteDownvoteRatio = upvoteDownvoteRatio;
        this.averageGivenGrade = averageGivenGrade;
    }

    public void calculateStatistics() {}

}
