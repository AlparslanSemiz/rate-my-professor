package com.example.myapplication_java.DomainModel;

import java.util.ArrayList;
import java.util.List;

public class Professor {
    public String professorId;
    public String name;
    public String department;
    public Professor(String professorId, String name, String department) {
        this.professorId = professorId;
        this.name = name;
        this.department = department;
    }

    //TODO: Implement here
    public List<Lecture> getLectures() {
        return new ArrayList<>();
    }
}
