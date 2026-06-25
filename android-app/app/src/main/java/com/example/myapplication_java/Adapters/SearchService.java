package com.example.myapplication_java.Adapters;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;

import java.util.List;

@Dao
public interface SearchService {

    @Query("SELECT * FROM professors " +
            "WHERE firstName LIKE '%' || :query || '%' " +
            "OR lastName LIKE '%' || :query || '%' " +
            "ORDER BY lastName ASC")
    List<Professor> searchProfessors(String query);

    //BAD METHOD FIX IN THE FUTURE
    @Insert
    void insertProfessor(Professor professor);

    @Query("SELECT * FROM lectures WHERE name LIKE '%' || :query || '%' ORDER BY name ASC")
    List<Lecture> searchLectures(String query);

    @Insert
    void insertLecture(Lecture lecture);

    @Query("DELETE FROM professors")
    void deleteProfessors();

    @Query("DELETE FROM lectures")
    void deleteLectures();

}
