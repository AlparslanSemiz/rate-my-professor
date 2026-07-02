package com.pse.lecture.dto.response;

import java.util.List;

public record LecturesResponse(
        String message,
        boolean success,
        List<LectureResponse> lectures
) {
}
