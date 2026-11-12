package com.example.ratemyprofessor.domain;

/**
 * A single topic of a rating together with the grade the user gave it.
 *
 * @param name  the displayed name of the topic, for example "Clarity"
 * @param value the given grade, on a scale from 0 to 5
 */
public record RatingTopic (
    String name,
    int value
) {}
