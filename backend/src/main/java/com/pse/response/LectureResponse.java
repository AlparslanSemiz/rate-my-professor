package com.pse.response;

import java.util.UUID;

import com.pse.model.enums.SemesterSeason;


public record LectureResponse(
        UUID id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,
        UUID professorId,
        String professorFirstName,
        String professorLastName,
        int commentCount,
        int ratingCount
) {}