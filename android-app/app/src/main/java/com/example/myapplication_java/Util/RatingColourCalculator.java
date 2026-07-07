package com.example.myapplication_java.Util;

import android.graphics.Color;

/**
 * This utility class (method) matches ratings from 0.0 - 5.0 to Colours from red to green. (Benutzt britisches Englisch um Enno abzufucken)
 */
public class RatingColourCalculator {

    public static int ratingColourCalculator(double rating) {
        // Zahlenbereich von 0-5 auf 0-1 normalisieren
        double ratio = rating / 5.0;

        int red = (int) (255 * (1 - ratio));
        int green = (int) (255 * ratio);

        // ARGB Format = "AlphaRedGreenBlue"
        return Color.rgb(red, green, 0);
    }
}
