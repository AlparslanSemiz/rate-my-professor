package com.example.ratemyprofessor.domain;

/**
 * A lecture held by one professor in one semester, which is what actually gets rated.
 *
 * <p>The same lecture held by a different professor, or in a different semester, is a
 * different offering with its own ratings and comments.</p>
 *
 * @param offeringId unique id of the offering
 * @param lecture    the lecture being held
 * @param professor  the professor holding it
 * @param semester   the semester it is held in
 */
public record LectureOffering (
    String offeringId,
    Lecture lecture,
    Professor professor,
    Semester semester
) {}
