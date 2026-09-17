package com.example.ratemyprofessor.domain;

import java.util.List;

/**
 * Describes a lecture offering together with its professors and rating statistics.
 *
 * @param id the unique identifier
 * @param name the name of the lecture
 * @param code the lecture code
 * @param semesterYear the year of the semester
 * @param semesterSeason the season of the semester
 * @param active whether the entry is active
 * @param professors the professors associated with this entry
 * @param commentCount the number of comments
 * @param ratingCount the number of ratings
 * @param averageRating the average rating
 */
public record LectureModel(
        String id,
        String name,
        String code,
        int semesterYear,
        SemesterSeason semesterSeason,
        boolean active,
        List<Professor> professors,
        int commentCount,
        int ratingCount,
        double averageRating
) {}