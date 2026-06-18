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
    public Lecture(String id, String name, String code) {
        this.name = name;
        this.code = code;
        this.id = id;
    }

    public List<Professor> getProfessors() {
        return new ArrayList<>();
    }
}
