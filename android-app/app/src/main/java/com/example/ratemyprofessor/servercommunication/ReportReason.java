package com.example.ratemyprofessor.servercommunication;

import androidx.annotation.NonNull;

public enum ReportReason {
    SPAM("Spam"),
    INSULT("Insult"),
    HARASSMENT("Harassment"),
    HATE_SPEECH("Hate Speech"),
    PERSONAL_INFORMATION("Personal Information"),
    OFF_TOPIC("Off Topic"),
    INAPPROPRIATE_CONTENT("Inappropriate Content"),
    OTHER("Other");

    private final String displayName;

    ReportReason(String displayName) {
        this.displayName = displayName;
    }

    @NonNull
    @Override
    public String toString() {
        return displayName;
    }
}
