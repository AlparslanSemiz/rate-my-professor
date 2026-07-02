package com.example.myapplication_java.Adapters;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.DomainModel.SemesterSeason;

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

    @Query("SELECT * FROM lectures WHERE professorId = :professorId ORDER BY name ASC")
    List<Lecture> getLecturesByProfessor(String professorId);

    @Query("SELECT * FROM lectures WHERE professorId = :professorId AND name = :lectureTitle ORDER BY name ASC")
    List<Lecture> getLecturesByProfessorAndLecture(String professorId, String lectureTitle);

    @Query("SELECT DISTINCT name FROM lectures")
    List<String> getLectureTitles();

    @Query("SELECT professors.* FROM professors JOIN lectures ON professors.id = lectures.professorId WHERE lectures.name = :lectureTitle")
    List<Professor> getProfessorsByLectureTitle(String lectureTitle);
    @Query("SELECT DISTINCT name FROM lectures WHERE professorId = :professorId ORDER BY name ASC")
    List<String> getLectureTitlesByProfessor(String professorId);

    @Query("SELECT semesterYear, semesterSeason FROM lectures WHERE professorId = :professorId AND name = :lectureTitle")
    List<Semester> getSemestersByProfessorAndLectureTitle(String professorId, String lectureTitle);

    @Query("SELECT * FROM lectures WHERE professorId = :professorId AND name = :lectureTitle AND " +
            "semesterYear = :semesterYear AND semesterSeason = :season")
    List<Lecture> getLecture(String professorId, String lectureTitle, int semesterYear, SemesterSeason season);

}
