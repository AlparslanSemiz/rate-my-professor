package com.example.ratemyprofessor.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.ForeignKey;

/**
 * The rating one user gave to one lecture offering.
 *
 * <p>A rating is not a single number: the user grades several topics separately, and the
 * value shown on the offering screen is the average over those topics.</p>
 *
 */
@Entity(tableName = "ratings",
        primaryKeys = {"lectureID", "rater", "category"},
        foreignKeys = @ForeignKey(
                entity = Lecture.class,
                parentColumns = "id",
                childColumns = "lectureID",
                onDelete = ForeignKey.CASCADE
        )
)
public class Rating {
    @NonNull
    public String lectureID;
    @NonNull
    public RatingCategory category;
    public double score;
    @NonNull
    public Rater rater;

    public Rating (String lectureID, RatingCategory category, double score, Rater rater) {
        this.lectureID = lectureID;
        this.category = category;
        this.score = score;
        this.rater = rater;
    }
}
