package com.example.myapplication_java.Adapters;


/**
 * This Interface is implemented by the RatingAdapter to facilitate communication between the RatingViewHolder
 * and the Adapter when the user changes a rating
 */
public interface OnRatingChangedListener {

    void onRatingChanged(String name, double value);
}
