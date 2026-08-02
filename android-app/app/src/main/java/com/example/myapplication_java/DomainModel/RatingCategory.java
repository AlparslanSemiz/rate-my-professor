package com.example.myapplication_java.DomainModel;

public enum RatingCategory {
    ROOM("Raum"),
    ORGANIZATION("Organisation"),
    MATERIALS("Unterlagen/Folien"),
    WORKLOAD("Arbeitsaufwand"),

    LECTURE_UNDERSTANDABILITY("Verständlichkeit"),
    LECTURE_INTEREST("Interessantheit"),
    LECTURE_DIFFICULTY("Schwierigkeit"),
    LECTURE_STRUCTURE("Struktur"),
    LECTURE_PACE("Tempo"),
    LECTURE_EXAMPLES("Praxisbeispiele"),

    PROFESSOR_ENGAGEMENT("Engagement"),
    PROFESSOR_COMMUNICATION("Kommunikation"),
    PROFESSOR_AVAILABILITY("Erreichbarkeit"),
    PROFESSOR_EXAM_PREPARATION("Prüfungsvorbereitung"),

    EXERCISE_BOARDWORK("Tafelanschrieb"),
    EXERCISE_QUESTIONS("Fragen beantwortet"),
    EXERCISE_HELPFULNESS("Hilfreich"),
    EXERCISE_EXPLANATIONS("Erklärungen"),
    EXERCISE_EXAMPLES("Beispielaufgaben"),
    EXERCISE_PACE("Tempo"),

    TUTOR_EXPLANATION("Erklärfähigkeit"),
    TUTOR_PREPARATION("Vorbereitung"),
    TUTOR_MOTIVATION("Motivation"),
    TUTOR_FRIENDLINESS("Freundlichkeit"),
    TUTOR_FEEDBACK("Feedback");

    private final String displayName;

    RatingCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}