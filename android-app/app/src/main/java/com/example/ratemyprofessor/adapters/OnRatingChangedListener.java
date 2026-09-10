package com.example.ratemyprofessor.adapters;


import com.example.ratemyprofessor.domain.RatingCategory;

/**
 * This Interface is implemented by the RatingAdapter to facilitate communication between the RatingViewHolder
 * and the Adapter when the user changes a rating
 */
public interface OnRatingChangedListener {

    /**
     * Reports a change to the user rating for a category.
     *
     * @param category the rating category
     * @param value the rating value
     */
    void onRatingChanged(RatingCategory category, double value);
}
