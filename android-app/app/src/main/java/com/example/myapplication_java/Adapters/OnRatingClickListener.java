package com.example.myapplication_java.Adapters;

import com.example.myapplication_java.DomainModel.Semester;

public interface OnRatingClickListener {
    /**
     * @param semester the clicked rating in "List of my ratings"
     */
    void onRatingClick(Semester semester, String profId, String lectureId);
}
