package com.example.myapplication_java.DomainModel;

public class Rating {
    public String ratingId;
    public int value;
    public RatingCategory ratingCategory;
    public Rating(String ratingId, int value, RatingCategory ratingCategory) {
        this.ratingCategory = ratingCategory;
        this.ratingId = ratingId;
        this.value = value;
    }
}
