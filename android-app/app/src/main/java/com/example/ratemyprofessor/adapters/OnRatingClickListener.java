package com.example.ratemyprofessor.adapters;

import com.example.ratemyprofessor.domain.Semester;

public interface OnRatingClickListener {
    /**
     * @param semester the clicked rating in "List of my ratings"
     */
    void onRatingClick(Semester semester, String profId, String lectureId);
}
