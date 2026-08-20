package com.example.myapplication_java.DomainModel;

import java.util.List;

public record LectureModel(
        String id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,
        List<Professor> professors,
        int commentCount,
        int ratingCount
) {}