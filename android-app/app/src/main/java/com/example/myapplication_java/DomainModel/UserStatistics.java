package com.example.myapplication_java.DomainModel;

/**
 * Summary of how much a user contributed, shown on their own profile.
 */
public class UserStatistics {

    /**
     * How many reviews the user wrote.
     */
    public int reviewCount;

    /**
     * How many comments the user wrote.
     */
    public int commentCount;

    /**
     * Upvotes divided by downvotes across all of the user's comments.
     */
    public double upvoteDownvoteRatio;

    /**
     * Average of all grades the user gave, on a scale from 0.0 to 5.0.
     */
    public double averageGivenGrade;

    public UserStatistics(int reviewCount, int commentCount, double upvoteDownvoteRatio, double averageGivenGrade) {
        this.reviewCount = reviewCount;
        this.commentCount = commentCount;
        this.upvoteDownvoteRatio = upvoteDownvoteRatio;
        this.averageGivenGrade = averageGivenGrade;
    }

    /**
     * Recalculates all values above from the user's reviews, comments and votes.
     * Not implemented yet, the values are set through the constructor for now.
     */
    public void calculateStatistics() {}

}
