package com.example.ratemyprofessor.adapters;


import com.example.ratemyprofessor.domain.RatingCategory;

/**
 * This Interface is implemented by the RatingAdapter to facilitate communication between the RatingViewHolder
 * and the Adapter when the user changes a rating
 */
public interface OnRatingChangedListener {

    void onRatingChanged(RatingCategory category, double value);
}
