package com.example.ratemyprofessor.servercommunication.responses;

public record UserRatingDto(
        LectureResponse lecture,
        double overallRating
) {
}
