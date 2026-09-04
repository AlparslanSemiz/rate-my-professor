package com.example.ratemyprofessor.DomainModel;

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
