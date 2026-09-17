package com.example.ratemyprofessor.domain;

import java.util.List;

/**
 * Defines the rating categories available for each kind of lecture offering.
 */
public enum LectureType {
    /**
     * A lecture offering without an exercise component.
     */
    LECTURE_ONLY(List.of(
            RatingCategory.ROOM,
            RatingCategory.ORGANIZATION,
            RatingCategory.MATERIALS,
            RatingCategory.WORKLOAD,

            RatingCategory.LECTURE_UNDERSTANDABILITY,
            RatingCategory.LECTURE_INTEREST,
            RatingCategory.LECTURE_DIFFICULTY,
            RatingCategory.LECTURE_STRUCTURE,
            RatingCategory.LECTURE_PACE,

            RatingCategory.PROFESSOR_ENGAGEMENT,
            RatingCategory.PROFESSOR_COMMUNICATION,
            RatingCategory.PROFESSOR_AVAILABILITY,
            RatingCategory.PROFESSOR_EXAM_PREPARATION
    )),

    /**
     * A lecture offering with an exercise component.
     */
    LECTURE_AND_EXERCISE(List.of(
            RatingCategory.ROOM,
            RatingCategory.ORGANIZATION,
            RatingCategory.MATERIALS,
            RatingCategory.WORKLOAD,

            RatingCategory.LECTURE_UNDERSTANDABILITY,
            RatingCategory.LECTURE_INTEREST,
            RatingCategory.LECTURE_DIFFICULTY,
            RatingCategory.LECTURE_STRUCTURE,
            RatingCategory.LECTURE_PACE,

            RatingCategory.PROFESSOR_ENGAGEMENT,
            RatingCategory.PROFESSOR_COMMUNICATION,
            RatingCategory.PROFESSOR_AVAILABILITY,
            RatingCategory.PROFESSOR_EXAM_PREPARATION,

            RatingCategory.EXERCISE_BOARDWORK,
            RatingCategory.EXERCISE_QUESTIONS,
            RatingCategory.EXERCISE_HELPFULNESS,
            RatingCategory.EXERCISE_EXPLANATIONS,
            RatingCategory.EXERCISE_EXAMPLES,

            RatingCategory.TUTOR_EXPLANATION,
            RatingCategory.TUTOR_PREPARATION,
            RatingCategory.TUTOR_FRIENDLINESS,
            RatingCategory.TUTOR_FEEDBACK
    ));


    private final List<RatingCategory> defaultCategories;

    /**
     * Creates a LectureType with the supplied values.
     *
     * @param defaultCategories the rating categories available for this lecture type
     */
    LectureType(List<RatingCategory> defaultCategories) {
        this.defaultCategories = defaultCategories;
    }

    /**
     * Returns the rating categories associated with this lecture type.
     *
     * @return the categories available for this lecture type
     */
    public List<RatingCategory> getDefaultCategories() {
        return defaultCategories;
    }
}
