package com.example.ratemyprofessor.domain;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

/**
 * One concrete lecture offering: a lecture held by one professor in one semester.
 *
 * <p>A lecture that runs every year therefore appears once per semester, each time with its
 * own id. The lecture name is what stays the same across those rows, which is why the search
 * and the profile screen group by {@link #name} rather than by {@link #id}.</p>
 *
 * <p>This is a Room entity of the "lectures" table. Room writes the fields directly, so they
 * have to stay public and the class needs the full constructor below.</p>
 */
@Entity(tableName = "lectures")
public class Lecture {

    /**
     * Unique id of this offering, also used as the primary key of the table.
     */
    @NonNull
    @PrimaryKey
    public String id;

    /**
     * Displayed name, for example "Programmieren".
     */
    public String name;

    /**
     * The lecture number of the university course catalogue.
     */
    public String code;

    /**
     * Year of the semester this offering belongs to.
     */
    public int semesterYear;

    /**
     * Whether the offering belongs to the summer or the winter term.
     */
    public SemesterSeason semesterSeason;

    /**
     * Whether the lecture is still being held.
     */
    public boolean active;

    /**
     * How many comments were written for this offering.
     */
    public int commentCount;

    /**
     * How many ratings were given for this offering.
     */
    public int ratingCount;

    /**
     * The average rating.
     */
    public double averageRating;

    /**
     * Creates a Lecture with the supplied values.
     *
     * @param id the unique identifier
     * @param name the name of the lecture
     * @param code the lecture code
     * @param semesterYear the year of the semester
     * @param semesterSeason the season of the semester
     * @param active whether the entry is active
     * @param commentCount the number of comments
     * @param ratingCount the number of ratings
     * @param averageRating the average rating
     */
    public Lecture(@NonNull String id, String name, String code, int semesterYear, SemesterSeason semesterSeason,
                   boolean active, int commentCount, int ratingCount, double averageRating) {
        this.name = name;
        this.code = code;
        this.id = id;
        this.semesterYear = semesterYear;
        this.semesterSeason = semesterSeason;
        this.active = active;
        this.commentCount = commentCount;
        this.ratingCount = ratingCount;
        this.averageRating = averageRating;
    }

}
