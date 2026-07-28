package com.example.myapplication_java.DomainModel;

import java.util.Date;

/**
 * A written review of a lecture offering.
 *
 * <p>Unlike a {@link Comment}, a review belongs to a rating and carries the grade the user
 * gave, which is why it can be edited later, see {@link #updatedAt()}.</p>
 *
 * @param reviewId     unique id of the review
 * @param createdAt    when the review was first written
 * @param updatedAt    when the review was last edited
 * @param averageGrade the average of the grades given with this review, from 0.0 to 5.0
 * @param text         the review text
 */
public record Review (
    String reviewId,
    Date createdAt,
    Date updatedAt,
    double averageGrade,
    String text
) {}
