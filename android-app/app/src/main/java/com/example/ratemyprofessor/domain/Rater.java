package com.example.ratemyprofessor.domain;

/**
 * Distinguishes aggregate ratings from the current user ratings.
 */
public enum Rater {
    /**
     * An aggregate rating across users.
     */
    AVERAGE,
    /**
     * A rating given by the current user.
     */
    USER
}
