package com.example.ratemyprofessor.domain;

import androidx.annotation.NonNull;
import androidx.room.Entity;


/**
 * The rating one user gave to one lecture offering.
 *
 * <p>A rating is not a single number: the user grades several topics separately, and the
 * value shown on the offering screen is the average over those topics.</p>
 *
 */
@Entity(tableName = "ratings",
       primaryKeys = {"lectureID", "rater", "category"}
)
public class Rating {
    @NonNull
    public String lectureID;
    @NonNull
    public RatingCategory category;
    public double score;
    @NonNull
    public Rater rater;

    public Rating (@NonNull String lectureID, @NonNull RatingCategory category, double score, @NonNull Rater rater) {
        this.lectureID = lectureID;
        this.category = category;
        this.score = score;
        this.rater = rater;
    }
}
