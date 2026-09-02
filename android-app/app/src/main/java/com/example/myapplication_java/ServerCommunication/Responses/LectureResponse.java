package com.example.myapplication_java.ServerCommunication.Responses;

import com.example.myapplication_java.DomainModel.SemesterSeason;

import java.util.List;

public record LectureResponse(
        String id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,

        //can be ignored at this time says luis... :O
        //lectureType lectureType,

        List<ProfessorShortResponse> professors,
        int commentCount,
        int ratingCount
) {
}
