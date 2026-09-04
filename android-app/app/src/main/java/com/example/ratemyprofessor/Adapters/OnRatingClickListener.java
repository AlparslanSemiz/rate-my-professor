package com.example.ratemyprofessor.Adapters;

import com.example.ratemyprofessor.DomainModel.Semester;

public interface OnRatingClickListener {
    /**
     * @param semester the clicked rating in "List of my ratings"
     */
    void onRatingClick(Semester semester, String profId, String lectureId);
}
