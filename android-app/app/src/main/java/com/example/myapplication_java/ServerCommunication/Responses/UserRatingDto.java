package com.example.myapplication_java.ServerCommunication.Responses;

public record UserRatingDto(
        LectureResponse lecture,
        double overallRating
) {
}
