package com.example.myapplication_java.DomainModel;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

import java.util.ArrayList;
import java.util.List;

@Entity(tableName = "lectures")
public class Lecture {
    @NonNull
    @PrimaryKey
    public String id;
    public String name;
    public String code;
    public int semesterYear;
    public SemesterSeason semesterSeason;
    public boolean active;
    public String professorId;
    public int commentCount;
    public int ratingCount;
    public Lecture(String id, String name, String code, int semesterYear, SemesterSeason semesterSeason,
                   boolean active, String professorId, int commentCount, int ratingCount) {
        this.name = name;
        this.code = code;
        this.id = id;
        this.semesterYear = semesterYear;
        this.semesterSeason = semesterSeason;
        this.active = active;
        this.professorId = professorId;
        this.commentCount = commentCount;
        this.ratingCount = ratingCount;
    }

    public List<Professor> getProfessors() {
        return new ArrayList<>();
    }
}
