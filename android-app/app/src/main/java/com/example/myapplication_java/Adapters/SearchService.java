package com.example.myapplication_java.Adapters;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import com.example.myapplication_java.DomainModel.CommentModel;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.DomainModel.SemesterSeason;

import org.w3c.dom.Comment;

import java.util.List;

/**
 * This is the interface to the database. The queries are created and sent to database
 * here.
 *
 * <p>Room generates the implementation from the annotations below. All of these methods block,
 * so they must be called from a background thread, never from the main thread.</p>
 *
 * <p>Keep in mind that the "lectures" table holds one row per lecture <em>and</em> semester.
 * Queries returning titles therefore use DISTINCT, while queries returning {@link Lecture}
 * objects return one entry per offering.</p>
 */
@Dao
public interface SearchService {

    // --- Search, used by the search screen ------------------------------------------------

    /**
     * Finds professors whose first or last name contains the query.
     *
     * @param query the typed text; an empty string matches every professor
     * @return the matching professors, sorted by last name
     */
    @Query("SELECT * FROM professors " +
            "WHERE firstName LIKE '%' || :query || '%' " +
            "OR lastName LIKE '%' || :query || '%' " +
            "ORDER BY lastName ASC")
    List<Professor> searchProfessors(String query);

    /**
     * Finds lectures whose name contains the query.
     *
     * @param query the typed text; an empty string matches every lecture
     * @return the matching offerings, sorted by name
     */
    @Query("SELECT * FROM lectures WHERE name LIKE '%' || :query || '%' ORDER BY name ASC")
    List<Lecture> searchLectures(String query);

    // --- Writing, used when refreshing from the server ------------------------------------

    /**
     * Inserts a single professor.
     */
    //BAD METHOD FIX IN THE FUTURE
    @Insert
    void insertProfessor(Professor professor);

    /**
     * Inserts a single lecture offering.
     */
    @Insert
    void insertLecture(Lecture lecture);

    /**
     * Empties the professors table before the fresh server data is written.
     */
    @Query("DELETE FROM professors")
    void deleteProfessors();

    /**
     * Empties the lectures table before the fresh server data is written.
     */
    @Query("DELETE FROM lectures")
    void deleteLectures();

    // --- Profile screen, narrowing down one lecture offering ------------------------------

    /**
     * @param professorId the professor to look up
     * @return every offering held by that professor, sorted by name
     */
    @Query("SELECT * FROM lectures WHERE professorId = :professorId ORDER BY name ASC")
    List<Lecture> getLecturesByProfessor(String professorId);

    /**
     * @param professorId  the professor to look up
     * @param lectureTitle the name of the lecture
     * @return every semester's offering of that lecture by that professor
     */
    @Query("SELECT * FROM lectures WHERE professorId = :professorId AND name = :lectureTitle ORDER BY name ASC")
    List<Lecture> getLecturesByProfessorAndLecture(String professorId, String lectureTitle);

    /**
     * @return the name of every lecture, each one only once
     */
    @Query("SELECT DISTINCT name FROM lectures")
    List<String> getLectureTitles();

    /**
     * @param lectureTitle the name of the lecture
     * @return every professor who holds a lecture with that name
     */
    @Query("SELECT professors.* FROM professors JOIN lectures ON professors.id = lectures.professorId WHERE lectures.name = :lectureTitle")
    List<Professor> getProfessorsByLectureTitle(String lectureTitle);

    /**
     * @param professorId the professor to look up
     * @return the name of every lecture held by that professor, each one only once
     */
    @Query("SELECT DISTINCT name FROM lectures WHERE professorId = :professorId ORDER BY name ASC")
    List<String> getLectureTitlesByProfessor(String professorId);

    /**
     * @param professorId  the professor to look up
     * @param lectureTitle the name of the lecture
     * @return every semester in which that professor held that lecture
     */
    @Query("SELECT semesterYear, semesterSeason FROM lectures WHERE professorId = :professorId AND name = :lectureTitle")
    List<Semester> getSemestersByProfessorAndLectureTitle(String professorId, String lectureTitle);

    /**
     * Looks up the one offering identified by professor, lecture and semester.
     *
     * @param professorId  the professor holding the offering
     * @param lectureTitle the name of the lecture
     * @param semesterYear the year of the semester
     * @param season       the term of the semester
     * @return the matching offering, or an empty list when there is none
     */
    @Query("SELECT * FROM lectures WHERE professorId = :professorId AND name = :lectureTitle AND " +
            "semesterYear = :semesterYear AND semesterSeason = :season")
    List<Lecture> getLecture(String professorId, String lectureTitle, int semesterYear, SemesterSeason season);

    @Query("UPDATE lectures SET professorId = '748d6383-5dd6-42f1-a797-77f304beb3fb' WHERE id = 'bd9dd15d-bc13-4630-a2d1-ac76f542124d'")
    void fillMissingData();

    @Insert
    void insertComment(CommentModel comment);

    @Query("DELETE FROM comments")
    void deleteComments();

    @Query("SELECT * FROM professors WHERE id = :id LIMIT 1")
    Professor getProfessorById(String id);
}
