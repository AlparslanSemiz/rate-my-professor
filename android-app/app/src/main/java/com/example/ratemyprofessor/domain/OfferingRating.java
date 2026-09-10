package com.example.ratemyprofessor.domain;

import androidx.room.Entity;

@Entity(
        primaryKeys = {"offeringID, category"},
        tableName = "offering_ratings"
)
public class OfferingRating {
    public String offeringID;
    public String category;
    public double value;
}
