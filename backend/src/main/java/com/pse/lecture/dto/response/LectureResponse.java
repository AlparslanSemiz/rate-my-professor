package com.pse.lecture.dto.response;

import java.util.List;
import java.util.UUID;

import com.pse.shared.enums.SemesterSeason;


public record LectureResponse(
        UUID id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,
        List<UUID> professorIds,
        String professorFirstName,
        String professorLastName,
        int commentCount,
        int ratingCount
) {}