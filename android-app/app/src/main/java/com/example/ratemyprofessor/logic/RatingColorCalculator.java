package com.example.ratemyprofessor.logic;

import android.content.Context;
import android.content.res.Configuration;
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
     * How much of the channel range the colours use on a light background.
     *
     * <p>A full brightness green is barely readable on white, so the whole ramp is darkened
     * when the app is in light mode. On a dark background the full range is used, which is
     * what the colours were picked for.</p>
     */
    private static final double LIGHT_BACKGROUND_BRIGHTNESS = 0.62;

    /**
     * Utility class, not meant to be instantiated.
     */
    private RatingColorCalculator() {
    }

    /**
     * Picks the colour a rating is displayed in: red for 0.0, green for 5.0 and the mix
     * in between.
     *
     * @param context the context of the view that shows the rating, which tells whether the
     *                colour has to be readable on a dark or on a light background
     * @param rating  the rating to colour; values outside 0.0 - 5.0 are pulled back into range
     * @return the colour as an ARGB integer
     */
    public static int calculateColour(Context context, double rating) {
        // Ratings outside the scale would produce negative or oversized colour channels,
        // so they are cut off at the ends of the scale first.
        double boundedRating = Math.max(0.0, Math.min(MAX_RATING, rating));

        // Normalize number range from 0-5 to 0-1
        double ratio = boundedRating / MAX_RATING;

        double brightness = isDarkBackground(context) ? 1.0 : LIGHT_BACKGROUND_BRIGHTNESS;

        int red = (int) (MAX_CHANNEL * (1 - ratio) * brightness);
        int green = (int) (MAX_CHANNEL * ratio * brightness);

        // ARGB Format = "AlphaRedGreenBlue"
        return Color.rgb(red, green, 0);
    }

    /**
     * @param context the context the colour is shown in
     * @return true when the app currently draws on a dark background
     */
    private static boolean isDarkBackground(Context context) {
        int currentNightMode = context.getResources().getConfiguration().uiMode
                & Configuration.UI_MODE_NIGHT_MASK;
        return currentNightMode == Configuration.UI_MODE_NIGHT_YES;
    }
}
