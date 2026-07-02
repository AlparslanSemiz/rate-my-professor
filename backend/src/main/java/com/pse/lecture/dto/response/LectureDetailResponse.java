package com.pse.lecture.dto.response;


public record LectureDetailResponse(
        String message,
        boolean success,
        LectureResponse lecture
) {
}
