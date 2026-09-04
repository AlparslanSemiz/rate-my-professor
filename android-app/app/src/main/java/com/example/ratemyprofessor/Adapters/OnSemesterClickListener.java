package com.example.ratemyprofessor.Adapters;

import com.example.ratemyprofessor.DomainModel.Semester;

/**
 * Reports which semester the user clicked.
 */
public interface OnSemesterClickListener {

    /**
     * @param semester the clicked semester
     */
    void onSemesterClick(Semester semester);
}