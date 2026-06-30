package com.pse.lecture.dto.request;

import com.pse.shared.enums.SemesterSeason;

import java.util.UUID;

public record AddLectureRequest(
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,
        UUID professorId
) {
}
