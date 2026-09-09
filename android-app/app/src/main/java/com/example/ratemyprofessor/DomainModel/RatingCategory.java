package com.example.ratemyprofessor.DomainModel;

public enum RatingCategory {
    OVERALL("Overall", 0),

    // General
    ROOM("Room", 0.5),
    ORGANIZATION("Organization", 1.0),
    MATERIALS("Materials/Slides", 1.0),
    WORKLOAD("Workload", 1.0),


    // Lecture
    LECTURE_UNDERSTANDABILITY("Understandability", 2.0),
    LECTURE_INTEREST("Interest", 1.5),
    LECTURE_DIFFICULTY("Difficulty", 1.0),
    LECTURE_STRUCTURE("Structure", 1.5),
    LECTURE_PACE("Pace", 1.0),
    LECTURE_EXAMPLES("Practical Examples", 1.0),


    // Professor
    PROFESSOR_ENGAGEMENT("Engagement", 1.5),
    PROFESSOR_COMMUNICATION("Communication", 1.5),
    PROFESSOR_AVAILABILITY("Availability", 1.0),
    PROFESSOR_EXAM_PREPARATION("Exam Preparation", 2.0),


    // Exercise
    EXERCISE_BOARDWORK("Board Work", 1.0),
    EXERCISE_QUESTIONS("Question Answering", 1.5),
    EXERCISE_HELPFULNESS("Helpfulness", 2.0),
    EXERCISE_EXPLANATIONS("Explanations", 1.5),
    EXERCISE_EXAMPLES("Example Problems", 1.5),
    EXERCISE_PACE("Pace", 1.0),


    // Tutor
    TUTOR_EXPLANATION("Explanation Skills", 2.0),
    TUTOR_PREPARATION("Preparation", 1.5),
    TUTOR_MOTIVATION("Motivation", 1.0),
    TUTOR_FRIENDLINESS("Friendliness", 1.0),
    TUTOR_FEEDBACK("Feedback", 1.0);


    private final String displayName;
    private final double defaultWeight;

    RatingCategory(String displayName, double defaultWeight) {
        this.displayName = displayName;
        this.defaultWeight = defaultWeight;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getDefaultWeight() {
        return defaultWeight;
    }
}