package com.example.myapplication_java.DomainModel;

/**
 * A topic that can be rated, as defined by the backend.
 *
 * <p>While a {@link RatingTopic} is one user's answer, this is the question itself, which is
 * the same for every lecture offering.</p>
 *
 * @param categoryId  unique id of the category
 * @param name        the displayed name, for example "Clarity"
 * @param description the explanation shown to the user before they grade this topic
 */
public record RatingCategory (
    String categoryId,
    String name,
    String description
) {}
