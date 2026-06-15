package com.example.myapplication_java.DomainModel;

public class Semester {
    public String semesterId;
    public String name;
    public int year;
    public SemesterType type;
    public Semester (String semesterId, String name, int year, SemesterType type) {
        this.semesterId = semesterId;
        this.name = name;
        this.year = year;
        this.type = type;
    }
}
