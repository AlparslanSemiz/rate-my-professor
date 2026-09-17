package com.example.ratemyprofessor.servercommunication;

/**
 * Visibility of user written content such as comments and answers.
 *
 * <p>Content is never removed from the server, it is only flagged. That way a moderated
 * comment can be restored and answers of a deleted comment keep their parent.</p>
 */
public enum ContentStatus {

    /**
     * Shown to everyone.
     */
    VISIBLE,

    /**
     * Hidden by moderation, but still stored.
     */
    HIDDEN,

    /**
     * Deleted by its author, but still stored.
     */
    DELETED
}
