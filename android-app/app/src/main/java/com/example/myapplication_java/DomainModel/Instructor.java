package com.example.myapplication_java.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;

@Entity(
        tableName = "instructors",
        primaryKeys = {"lectureID", "professorID"},
        foreignKeys = {}
)
public class Instructor {
    @NonNull
    public String lectureID;
    @NonNull
    public String professorID;
    public String lectureTitle;
    public Instructor(String lectureID, String lectureTitle, String professorID) {
        this.lectureID = lectureID;
        this.professorID = professorID;
        this.lectureTitle = lectureTitle;
    }
}
