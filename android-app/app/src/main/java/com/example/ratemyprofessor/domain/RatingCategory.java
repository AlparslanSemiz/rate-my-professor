package com.example.ratemyprofessor.domain;

/**
 * Defines rating topics, their display labels, and their weights in the aggregate rating.
 */
public enum RatingCategory {
    /**
     * The overall rating category.
     */
    OVERALL("Overall", 0),

    // General
    /**
     * The room rating category.
     */
    ROOM("Room", 0.5),
    /**
     * The organization rating category.
     */
    ORGANIZATION("Organization", 1.0),
    /**
     * The materials rating category.
     */
    MATERIALS("Materials/Slides", 1.0),
    /**
     * The workload rating category.
     */
    WORKLOAD("Workload", 1.0),


    // Lecture
    /**
     * The lecture understandability rating category.
     */
    LECTURE_UNDERSTANDABILITY("Understandability", 2.0),
    /**
     * The lecture interest rating category.
     */
    LECTURE_INTEREST("Interest", 1.5),
    /**
     * The lecture difficulty rating category.
     */
    LECTURE_DIFFICULTY("Difficulty", 1.0),
    /**
     * The lecture structure rating category.
     */
    LECTURE_STRUCTURE("Structure", 1.5),
    /**
     * The lecture pace rating category.
     */
    LECTURE_PACE("Pace", 1.0),
    /**
     * The lecture examples rating category.
     */
    LECTURE_EXAMPLES("Practical Examples", 1.0),


    // Professor
    /**
     * The professor engagement rating category.
     */
    PROFESSOR_ENGAGEMENT("Engagement", 1.5),
    /**
     * The professor communication rating category.
     */
    PROFESSOR_COMMUNICATION("Communication", 1.5),
    /**
     * The professor availability rating category.
     */
    PROFESSOR_AVAILABILITY("Availability", 1.0),
    /**
     * The professor exam preparation rating category.
     */
    PROFESSOR_EXAM_PREPARATION("Exam Preparation", 2.0),


    // Exercise
    /**
     * The exercise boardwork rating category.
     */
    EXERCISE_BOARDWORK("Board Work", 1.0),
    /**
     * The exercise questions rating category.
     */
    EXERCISE_QUESTIONS("Question Answering", 1.5),
    /**
     * The exercise helpfulness rating category.
     */
    EXERCISE_HELPFULNESS("Helpfulness", 2.0),
    /**
     * The exercise explanations rating category.
     */
    EXERCISE_EXPLANATIONS("Explanations", 1.5),
    /**
     * The exercise examples rating category.
     */
    EXERCISE_EXAMPLES("Example Problems", 1.5),
    /**
     * The exercise pace rating category.
     */
    EXERCISE_PACE("Pace", 1.0),


    // Tutor
    /**
     * The tutor explanation rating category.
     */
    TUTOR_EXPLANATION("Explanation Skills", 2.0),
    /**
     * The tutor preparation rating category.
     */
    TUTOR_PREPARATION("Preparation", 1.5),
    /**
     * The tutor motivation rating category.
     */
    TUTOR_MOTIVATION("Motivation", 1.0),
    /**
     * The tutor friendliness rating category.
     */
    TUTOR_FRIENDLINESS("Friendliness", 1.0),
    /**
     * The tutor feedback rating category.
     */
    TUTOR_FEEDBACK("Feedback", 1.0);


    private final String displayName;
    private final double defaultWeight;

    /**
     * Creates a RatingCategory with the supplied values.
     *
     * @param displayName the label shown to the user
     * @param defaultWeight the weight used when calculating an aggregate rating
     */
    RatingCategory(String displayName, double defaultWeight) {
        this.displayName = displayName;
        this.defaultWeight = defaultWeight;
    }

    /**
     * Returns the display label of this rating category.
     *
     * @return the display label
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Returns the weight of this category in the aggregate rating.
     *
     * @return the category weight
     */
    public double getDefaultWeight() {
        return defaultWeight;
    }
}