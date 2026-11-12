package com.example.ratemyprofessor.servercommunication;

import androidx.annotation.NonNull;

/**
 * Defines the reasons a user can select when reporting a comment or reply.
 */
public enum ReportReason {
    /**
     * The spam report reason.
     */
    SPAM("Spam"),
    /**
     * The insult report reason.
     */
    INSULT("Insult"),
    /**
     * The harassment report reason.
     */
    HARASSMENT("Harassment"),
    /**
     * The hate speech report reason.
     */
    HATE_SPEECH("Hate Speech"),
    /**
     * The personal information report reason.
     */
    PERSONAL_INFORMATION("Personal Information"),
    /**
     * The off topic report reason.
     */
    OFF_TOPIC("Off Topic"),
    /**
     * The inappropriate content report reason.
     */
    INAPPROPRIATE_CONTENT("Inappropriate Content"),
    /**
     * The other report reason.
     */
    OTHER("Other");

    private final String displayName;

    /**
     * Creates a ReportReason with the supplied values.
     *
     * @param displayName the label shown to the user
     */
    ReportReason(String displayName) {
        this.displayName = displayName;
    }

    @NonNull
    @Override
    public String toString() {
        return displayName;
    }
}
