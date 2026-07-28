package com.pse.rating.model;

public enum RatingCategory {


    // Generell
    ROOM("Raum", 0.5),
    ORGANIZATION("Organisation", 1.0),
    MATERIALS("Unterlagen/Folien", 1.0),
    WORKLOAD("Arbeitsaufwand", 1.0),


    // Vorlesung
    LECTURE_UNDERSTANDABILITY("Verständlichkeit", 2.0),
    LECTURE_INTEREST("Interessant statt langweilig", 1.5),
    LECTURE_DIFFICULTY("Schwierigkeit", 1.0),
    LECTURE_STRUCTURE("Struktur", 1.5),
    LECTURE_PACE("Tempo", 1.0),
    LECTURE_EXAMPLES("Praxisbeispiele", 1.0),


    // Professor
    PROFESSOR_ENGAGEMENT("Engagement", 1.5),
    PROFESSOR_COMMUNICATION("Kommunikation", 1.5),
    PROFESSOR_AVAILABILITY("Erreichbarkeit", 1.0),
    PROFESSOR_EXAM_PREPARATION("Prüfungsvorbereitung", 2.0),


    // Übung
    EXERCISE_BOARDWORK("Tafelanschrieb", 1.0),
    EXERCISE_QUESTIONS("Fragen beantwortet", 1.5),
    EXERCISE_HELPFULNESS("Hilfreich", 2.0),
    EXERCISE_EXPLANATIONS("Erklärungen", 1.5),
    EXERCISE_EXAMPLES("Beispielaufgaben", 1.5),
    EXERCISE_PACE("Tempo", 1.0),


    // Übungsleiter
    TUTOR_EXPLANATION("Erklärfähigkeit", 2.0),
    TUTOR_PREPARATION("Vorbereitung", 1.5),
    TUTOR_MOTIVATION("Motivation", 1.0),
    TUTOR_FRIENDLINESS("Freundlichkeit", 1.0),
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
