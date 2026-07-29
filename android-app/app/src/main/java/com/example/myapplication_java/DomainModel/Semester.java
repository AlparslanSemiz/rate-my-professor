package com.example.myapplication_java.DomainModel;

/**
 * A single semester, for example the winter term of 2026.
 *
 * @param semesterYear   the year the semester started in
 * @param semesterSeason whether it is the summer or the winter term
 */
public record Semester (
    int semesterYear,
    SemesterSeason semesterSeason
) {}
