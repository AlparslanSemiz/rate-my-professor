package com.example.ratemyprofessor.ServerCommunication.Responses;

import com.example.ratemyprofessor.DomainModel.LectureType;
import com.example.ratemyprofessor.DomainModel.SemesterSeason;

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
