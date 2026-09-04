package com.example.ratemyprofessor.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.ForeignKey;

@Entity(
        tableName = "instructors",
        primaryKeys = {"lectureID", "professorID"},
        foreignKeys = {
//                @ForeignKey(
//                        entity = Professor.class,
//                        parentColumns = "id",
//                        childColumns = "professorID",
//                        onDelete = ForeignKey.CASCADE
//                ),
//                @ForeignKey(
//                        entity = Lecture.class,
//                        parentColumns = "id",
//                        childColumns = "lectureID"
//                )
        }
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
