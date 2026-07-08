package com.example.myapplication_java.logic;

import android.graphics.Color;

/**
 * This utility class (method) matches ratings from 0.0 - 5.0 to Colors from red to green. (Benutzt britisches Englisch um Enno abzufucken) >:[
 */
public class RatingColorCalculator {

    public static int ratingColourCalculator(double rating) {
        // Normalize number range from 0-5 to 0-1
        double ratio = rating / 5.0;

        int red = (int) (255 * (1 - ratio));
        int green = (int) (255 * ratio);

        // ARGB Format = "AlphaRedGreenBlue"
        return Color.rgb(red, green, 0);
    }
}
