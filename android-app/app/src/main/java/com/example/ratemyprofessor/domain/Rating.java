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
    /**
     * The identifier of the lecture offering.
     */
    @NonNull
    public String lectureID;
    /**
     * The rating category.
     */
    @NonNull
    public RatingCategory category;
    /**
     * The rating score.
     */
    public double score;
    /**
     * Whether the rating is a user rating or an aggregate.
     */
    @NonNull
    public Rater rater;

    /**
     * Creates a Rating with the supplied values.
     *
     * @param lectureID the identifier of the lecture offering
     * @param category the rating category
     * @param score the rating score
     * @param rater whether the rating is a user rating or an aggregate
     */
    public Rating (@NonNull String lectureID, @NonNull RatingCategory category, double score, @NonNull Rater rater) {
        this.lectureID = lectureID;
        this.category = category;
        this.score = score;
        this.rater = rater;
    }
}
