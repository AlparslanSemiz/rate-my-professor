package com.example.ratemyprofessor.Adapters;


import com.example.ratemyprofessor.DomainModel.RatingCategory;

/**
 * This Interface is implemented by the RatingAdapter to facilitate communication between the RatingViewHolder
 * and the Adapter when the user changes a rating
 */
public interface OnRatingChangedListener {

    void onRatingChanged(RatingCategory category, double value);
}
