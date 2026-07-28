package com.example.myapplication_java.logic;

import android.graphics.Color;

/**
 * This utility class (method) matches ratings from 0.0 - 5.0 to Colors from red to green. (Benutzt britisches Englisch um Enno abzufucken) >:[
 */
public final class RatingColorCalculator {

    /**
     * Highest rating the scale goes up to.
     */
    private static final double MAX_RATING = 5.0;

    /**
     * Highest value a single colour channel can have.
     */
    private static final int MAX_CHANNEL = 255;

    /**
     * Utility class, not meant to be instantiated.
     */
    private RatingColorCalculator() {
    }

    /**
     * Picks the colour a rating is displayed in: red for 0.0, green for 5.0 and the mix
     * in between.
     *
     * @param rating the rating to colour; values outside 0.0 - 5.0 are pulled back into range
     * @return the colour as an ARGB integer
     */
    public static int ratingColourCalculator(double rating) {
        // Ratings outside the scale would produce negative or oversized colour channels,
        // so they are cut off at the ends of the scale first.
        double boundedRating = Math.max(0.0, Math.min(MAX_RATING, rating));

        // Normalize number range from 0-5 to 0-1
        double ratio = boundedRating / MAX_RATING;

        int red = (int) (MAX_CHANNEL * (1 - ratio));
        int green = (int) (MAX_CHANNEL * ratio);

        // ARGB Format = "AlphaRedGreenBlue"
        return Color.rgb(red, green, 0);
    }
}
