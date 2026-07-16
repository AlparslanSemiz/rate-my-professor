package com.example.myapplication_java.Adapters;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;

/**
 * This class is for managing the control flow of professor-lecture selection.
 * Through this interface the main activity is notified as to how it should navigate
 * and set the appropriate fragments.
 */
public interface ControlFlowInterface {
    void onProfessorSelected(Professor professor);
    void onLectureSelected(String lectureTitle);
    void openLectureProfile(Professor professor, Semester semester, Lecture lecture);
}
