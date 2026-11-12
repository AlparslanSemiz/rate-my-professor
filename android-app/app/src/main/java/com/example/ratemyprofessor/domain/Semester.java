package com.example.ratemyprofessor.domain;

/**
 * A single semester, for example the winter term of 2026.
 *
 * @param semesterYear   the year the semester started in
 * @param semesterSeason whether it is the summer or the winter term
 */
public record Semester (
    int semesterYear,
    SemesterSeason semesterSeason
) {
    /**
     * Formats the semester season and year for display.
     *
     * @return the formatted semester name
     */
    public String getSemesterName() {
        return semesterSeason.toString() + semesterYear;
    }
}
