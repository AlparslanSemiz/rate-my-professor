package com.example.ratemyprofessor.ServerCommunication.Responses;

public record LectureDetailResponse(
        String message,
        boolean success,
        LectureResponse lecture
) {
}
