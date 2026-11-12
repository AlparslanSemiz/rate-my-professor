package com.example.ratemyprofessor.domain;

/**
 * Summary of how much a user contributed, shown on their own profile.
 */
public class UserStatistics {

    /**
     * How many reviews the user wrote.
     */
    private int reviewCount;

    /**
     * How many comments the user wrote.
     */
    private int commentCount;

    /**
     * Upvotes divided by downvotes across all the user's comments.
     */
    private double upvoteDownvoteRatio;

    /**
     * Average of all grades the user gave, on a scale from 0.0 to 5.0.
     */
    private double averageGivenGrade;

    /**
     * Creates a UserStatistics with the supplied values.
     *
     * @param reviewCount the number of reviews written by the user
     * @param commentCount the number of comments
     * @param upvoteDownvoteRatio the ratio of upvotes to downvotes
     * @param averageGivenGrade the average grade given by the user
     */
    public UserStatistics(int reviewCount, int commentCount, double upvoteDownvoteRatio, double averageGivenGrade) {
        this.reviewCount = reviewCount;
        this.commentCount = commentCount;
        this.upvoteDownvoteRatio = upvoteDownvoteRatio;
        this.averageGivenGrade = averageGivenGrade;
    }
}
