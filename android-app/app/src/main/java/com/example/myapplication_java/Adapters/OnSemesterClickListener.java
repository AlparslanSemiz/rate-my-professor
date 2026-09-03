package com.example.myapplication_java.Adapters;

import com.example.myapplication_java.DomainModel.Semester;

/**
 * Reports which semester the user clicked.
 */
public interface OnSemesterClickListener {

    /**
     * @param semester the clicked semester
     */
    void onSemesterClick(Semester semester);
}