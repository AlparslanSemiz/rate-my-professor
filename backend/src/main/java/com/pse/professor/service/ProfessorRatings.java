package com.pse.professor.service;

import java.util.List;

import com.pse.lecture.model.Lecture;
import com.pse.professor.model.Professor;
import com.pse.rating.model.Rating;
import com.pse.rating.service.RatingAverages;

/**
 * How a professor reaches the ratings they are judged by: every rating on every lecture they
 * teach.
 *
 * <p>Named because two unrelated places need the same walk and must not disagree about it.
 * {@code RatingService} recomputes the figure when a rating is submitted and stores it on the
 * row; the professor response recomputes it on read, so a rating removed by an administrator
 * is reflected without anyone having to remember to refresh the stored copy.
 */
public final class ProfessorRatings {

    private ProfessorRatings() {
    }

    /**
     * Every rating on every lecture this professor teaches.
     *
     * @param professor the professor
     * @return the result
     */
    public static List<Rating> of(Professor professor) {
        return professor.getLectures().stream()
                .map(Lecture::getRatings)
                .flatMap(List::stream)
                .toList();
    }

    /**
     * The professor's overall rating: {@code 0.0} when nobody has rated them.
     *
     * @param professor the professor
     * @return the result
     */
    public static double average(Professor professor) {
        return RatingAverages.overallAcross(of(professor));
    }
}
