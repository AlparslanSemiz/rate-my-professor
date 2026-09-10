package com.example.ratemyprofessor.domain;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;


/**
 * A professor that can be searched for and rated.
 *
 * <p>This is a Room entity of the "professors" table. Room writes the fields directly, so they
 * have to stay public and the class needs the full constructor below.</p>
 */
@Entity(tableName = "professors")
public class Professor {

    /**
     * Unique id of the professor, also used as the primary key of the table.
     */
    @NonNull
    @PrimaryKey
    public String id;

    public String firstName;

    public String lastName;

    /**
     * Average of all ratings this professor received, on a scale from 0.0 to 5.0.
     */
    public float averageRating;

    /**
     * How many ratings the average is based on.
     */
    public int ratingCount;

    public Professor(@NonNull String id, String firstName, String lastName, float averageRating, int ratingCount) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
    }
}
