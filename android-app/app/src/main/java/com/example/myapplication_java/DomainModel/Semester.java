package com.example.myapplication_java.DomainModel;

public class Semester {
    public int semesterYear;
    public SemesterSeason semesterSeason;
    public Semester (int semesterYear, SemesterSeason semesterSeason) {
        this.semesterYear = semesterYear;
        this.semesterSeason = semesterSeason;
    }
}
