package com.example.myapplication_java.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.util.ArrayList;
import java.util.List;

//changed, update the domain model.
@Entity(tableName = "professors")
public class Professor {
    @NonNull
    @PrimaryKey
    public String id;
    public String firstName;
    public String lastName;
    public int ratingCount;
    public float averageRating;
    public String department;
    public Professor(String id, String firstName, String lastName, String department, float averageRating) {
        this.id = id;
        this.department = department;
        this.firstName = firstName;
        this.lastName = lastName;
        this.averageRating = averageRating;
    }

    //TODO: Implement here
    public List<Lecture> getLectures() {
        return new ArrayList<>();
    }
}
