package com.example.ratemyprofessor.domain;

import androidx.annotation.NonNull;
import androidx.room.Entity;


/**
 * Associates a professor with a lecture offering in the local database.
 */
@Entity(
        tableName = "instructors",
        primaryKeys = {"lectureID", "professorID"}
)
public class Instructor {
    /**
     * The identifier of the lecture offering.
     */
    @NonNull
    public String lectureID;
    /**
     * The identifier of the professor.
     */
    @NonNull
    public String professorID;
    /**
     * The title of the lecture.
     */
    public String lectureTitle;
    /**
     * Creates a Instructor with the supplied values.
     *
     * @param lectureID the identifier of the lecture offering
     * @param lectureTitle the title of the lecture
     * @param professorID the identifier of the professor
     */
    public Instructor(@NonNull String lectureID, String lectureTitle, @NonNull String professorID) {
        this.lectureID = lectureID;
        this.professorID = professorID;
        this.lectureTitle = lectureTitle;
    }
}
