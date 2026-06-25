package com.example.myapplication_java.Adapters;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;

public interface ControlFlowInterface {
    void onProfessorSelected(Professor professor);
    void onLectureSelected(String lectureTitle);
    void openLectureProfile(Professor professor, Semester semester, Lecture lecture);
}
