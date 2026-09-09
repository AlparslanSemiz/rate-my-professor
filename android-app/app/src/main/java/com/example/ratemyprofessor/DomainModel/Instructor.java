package com.example.ratemyprofessor.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;


@Entity(
        tableName = "instructors",
        primaryKeys = {"lectureID", "professorID"}
)
public class Instructor {
    @NonNull
    public String lectureID;
    @NonNull
    public String professorID;
    public String lectureTitle;
    public Instructor(@NonNull String lectureID, String lectureTitle, @NonNull String professorID) {
        this.lectureID = lectureID;
        this.professorID = professorID;
        this.lectureTitle = lectureTitle;
    }
}
