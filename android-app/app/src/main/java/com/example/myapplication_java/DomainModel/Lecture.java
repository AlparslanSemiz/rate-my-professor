package com.example.myapplication_java.DomainModel;

import java.util.ArrayList;
import java.util.List;

public class Lecture {
    public String lectureId;
    public String title;
    public String moduleCode;
    public String description;
    public Lecture(String lectureId, String title, String moduleCode, String description) {
        this.description = description;
        this.title = title;
        this.moduleCode = moduleCode;
        this.lectureId = lectureId;
    }

    public List<Professor> getProfessors() {
        return new ArrayList<>();
    }
}
