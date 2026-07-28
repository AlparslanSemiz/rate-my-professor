package com.example.myapplication_java.DomainModel;

import java.util.List;

/**
 * The rating one user gave to one lecture offering.
 *
 * <p>A rating is not a single number: the user grades several topics separately, and the
 * value shown on the offering screen is the average over those topics.</p>
 *
 * @param lectureId the id of the rated lecture offering
 * @param topics    one graded topic per entry
 */
public record Rating (
    String lectureId,
    List<RatingTopic> topics
) {}
