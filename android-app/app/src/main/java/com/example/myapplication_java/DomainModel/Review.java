package com.example.myapplication_java.DomainModel;

import java.util.Date;

public class Review {
    public String reviewId;
    public Date createdAt;
    public Date updatedAt;
    public double averageGrade;
    public String text;
    public Review(String reviewId, Date createdAt, Date updatedAt, double averageGrade, String text) {
        this.reviewId = reviewId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.averageGrade = averageGrade;
        this.text = text;
    }
}
