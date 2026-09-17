package com.example.ratemyprofessor.domain;

import androidx.room.Entity;

/**
 * Stores a category rating associated with a lecture offering.
 */
@Entity(
        primaryKeys = {"offeringID, category"},
        tableName = "offering_ratings"
)
public class OfferingRating {
    /**
     * The identifier of the lecture offering.
     */
    public String offeringID;
    /**
     * The rating category.
     */
    public String category;
    /**
     * The rating value.
     */
    public double value;
}
