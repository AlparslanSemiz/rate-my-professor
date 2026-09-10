package com.example.ratemyprofessor.adapters;

import com.example.ratemyprofessor.domain.Semester;

/**
 * Reports which semester the user clicked.
 */
public interface OnSemesterClickListener {

    /**
     * Handles the semester click event.
     *
     * @param semester the clicked semester
     */
    void onSemesterClick(Semester semester);
}