package com.example.ratemyprofessor.ServerCommunication.Responses;

public record UserRatingDto(
        LectureResponse lecture,
        double overallRating
) {
}
