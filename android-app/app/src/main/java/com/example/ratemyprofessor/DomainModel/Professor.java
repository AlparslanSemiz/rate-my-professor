package com.example.ratemyprofessor.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.util.ArrayList;
import java.util.List;

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

    public Professor(String id, String firstName, String lastName, float averageRating, int ratingCount) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.averageRating = averageRating;
        this.ratingCount = ratingCount;
    }


    /**
     * The lectures held by this professor.
     *
     * <p>Not implemented yet, always returns an empty list. Screens that need this today query
     * the database directly through
     * {@link com.example.ratemyprofessor.Adapters.SearchService#getLecturesByProfessor(String)}.</p>
     *
     * @return an empty list until this is implemented
     */
    //TODO: Implement here
    public List<Lecture> getLectures() {
        return new ArrayList<>();
    }
}
