package com.pse.lecture.dto.response;

import java.util.List;
import java.util.UUID;

import com.pse.professor.dto.response.ProfessorShortResponse;
import com.pse.shared.enums.SemesterSeason;



public record LectureResponse(
        UUID id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,
        List<ProfessorShortResponse> professors,
        int commentCount,
        int ratingCount
) {}