package com.example.myapplication_java.ServerCommunication.Responses;

public record UserRatingDto(
        String lectureName,
        String semester,
        double overallRating
) {
}
