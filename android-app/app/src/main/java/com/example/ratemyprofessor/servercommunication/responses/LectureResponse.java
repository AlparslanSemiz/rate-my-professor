package com.example.ratemyprofessor.servercommunication.responses;

import com.example.ratemyprofessor.domain.LectureType;
import com.example.ratemyprofessor.domain.SemesterSeason;

import java.util.List;

/**
 * Describes a lecture offering, its professors, and its comment and rating statistics.
 *
 * @param id the unique identifier
 * @param name the name of the lecture
 * @param code the lecture code
 * @param semesterYear the year of the semester
 * @param semesterSeason the season of the semester
 * @param semesterLabel the display label of the semester
 * @param title the title
 * @param active whether the entry is active
 * @param lectureType the kind of lecture offering and its supported rating categories
 * @param professors the professors returned by the server
 * @param commentCount the number of comments
 * @param ratingCount the number of ratings
 * @param averageRating the average rating
 */
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
