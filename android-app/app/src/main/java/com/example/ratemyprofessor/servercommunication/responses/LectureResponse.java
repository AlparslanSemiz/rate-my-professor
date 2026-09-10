package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.LectureType;
import com.example.ratemyprofessor.domain.SemesterSeason;

import java.util.List;

public record LectureResponse(
        String id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        String semesterLabel,
        String title,
        boolean active,
        LectureType lectureType,
        List<ProfessorShortResponse> professors,
        int commentCount,
        int ratingCount,
        double averageRating
) {
}
