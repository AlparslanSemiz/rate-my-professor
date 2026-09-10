package com.example.ratemyprofessor.servercommunication.responses;

public record LectureDetailResponse(
        String message,
        boolean success,
        LectureResponse lecture
) {
}
