package com.example.myapplication_java.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.util.ArrayList;
import java.util.List;

@Entity(tableName = "professors")
public class Professor {
    @NonNull
    @PrimaryKey
    public String id;
    public String firstName;
    public String lastName;
    public float averageRating;
    public int ratingCount;
    public Professor(String id, String firstName, String lastName, float averageRating, int ratingCount) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
    }

    //TODO: Implement here
    public List<Lecture> getLectures() {
        return new ArrayList<>();
    }
}
