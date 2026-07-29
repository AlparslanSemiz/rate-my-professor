package com.example.myapplication_java.ServerCommunication.Responses;

/**
 * The average rating of a single topic, for example "Clarity".
 *
 * @param name  the displayed name of the rating topic
 * @param value the average of all ratings given for this topic, on a scale from 0.0 to 5.0
 */
public record TopicAverageResponse(
        String name,
        double value
) {}
