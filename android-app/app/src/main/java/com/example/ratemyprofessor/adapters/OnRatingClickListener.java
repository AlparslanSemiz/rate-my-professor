package com.example.ratemyprofessor.adapters;

import com.example.ratemyprofessor.domain.Semester;

/**
 * Receives selections from the list of ratings submitted by the user.
 */
public interface OnRatingClickListener {
    /**
     * Handles the rating click event.
     *
     * @param semester the clicked rating in "List of my ratings"
     *
     * @param profId the identifier of the professor
     * @param lectureId the identifier of the lecture offering
     */
    void onRatingClick(Semester semester, String profId, String lectureId);
}
