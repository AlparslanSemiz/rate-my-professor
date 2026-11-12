package com.example.ratemyprofessor.servercommunication.responses;

/**
 * Distinguishes reply notifications from warnings.
 */
public enum NotificationType {
    /**
     * A notification about a reply.
     */
    ANSWER,
    /**
     * A warning notification.
     */
    WARNING
}