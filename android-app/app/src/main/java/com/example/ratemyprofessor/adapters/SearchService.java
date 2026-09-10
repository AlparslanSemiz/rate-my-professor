package com.example.ratemyprofessor.adapters;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;
import androidx.room.Upsert;

import com.example.ratemyprofessor.domain.CommentModel;
import com.example.ratemyprofessor.domain.Instructor;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;

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
     *
     * @param professor the professor data
     */
    //BAD METHOD FIX IN THE FUTURE
    @Insert
    void insertProfessor(Professor professor);

    /**
     * Inserts professors, replacing existing entries with the same primary key.
     *
     * @param professors the professors to cache
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertProfessors(List<Professor> professors);

    /**
     * Inserts a single lecture offering.
     *
     * @param lecture the lecture offering data
     */
    @Insert
    void insertLecture(Lecture lecture);

    /**
     * Inserts lecture offerings, replacing existing entries with the same primary key.
     *
     * @param lectures the lecture offerings to cache
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertLectures(List<Lecture> lectures);

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

    /**
     * Replaces all cached professors in a single database transaction.
     *
     * @param professors the professors to cache
     */
    @Transaction
    default void replaceProfessors(List<Professor> professors) {
        deleteProfessors();
        insertProfessors(professors);
    }

    /**
     * Replaces all cached lecture offerings and instructor associations in a single transaction.
     *
     * @param lectures the lecture offerings to cache
     * @param instructors the associations between professors and lecture offerings
     */
    @Transaction
    default void replaceLectures(List<Lecture> lectures, List<Instructor> instructors) {
        deleteLectures();
        deleteInstructors();
        insertLectures(lectures);
        insertInstructors(instructors);
    }

    // --- Profile screen, narrowing down one lecture offering ------------------------------

    /**
     * Finds lecture offerings taught by the specified professor.
     *
     * @param professorId the professor to look up
     * @return every offering held by that professor, sorted by name
     */
    @Query("SELECT lectures.* FROM instructors JOIN lectures ON instructors.lectureID = lectures.id " +
            "WHERE instructors.professorID = :professorId ORDER BY name ASC")
    List<Lecture> getLecturesByProfessor(String professorId);

    /**
     * Finds offerings of a lecture taught by the specified professor.
     *
     * @param professorId  the professor to look up
     * @param lectureTitle the name of the lecture
     * @return every semester's offering of that lecture by that professor
     */
    @Query("SELECT lectures.* FROM lectures JOIN instructors ON instructors.lectureID = lectures.id " +
            "WHERE instructors.professorID = :professorId AND lectures.name = :lectureTitle ORDER BY name ASC")
    List<Lecture> getLecturesByProfessorAndLecture(String professorId, String lectureTitle);

    /**
     * Finds professors teaching a lecture with the specified title.
     *
     * @param lectureTitle the name of the lecture
     * @return every professor who holds a lecture with that name
     */
    @Query("SELECT professors.* FROM professors JOIN instructors ON " +
            "professors.id = instructors.professorId WHERE instructors.lectureTitle = :lectureTitle")
    List<Professor> getProfessorsByLectureTitle(String lectureTitle);

    /**
     * Returns the distinct lecture titles taught by the specified professor.
     *
     * @param professorId the professor to look up
     * @return the name of every lecture held by that professor, each one only once
     */
    @Query("SELECT DISTINCT lectureTitle FROM instructors WHERE professorID = :professorId ORDER BY lectureTitle ASC")
    List<String> getLectureTitlesByProfessor(String professorId);

    /**
     * Finds the semesters in which a professor taught the specified lecture.
     *
     * @param professorId  the professor to look up
     * @param lectureTitle the name of the lecture
     * @return every semester in which that professor held that lecture
     */
    @Query("SELECT lectures.semesterYear, lectures.semesterSeason FROM lectures JOIN instructors ON instructors.lectureID = lectures.id " +
            "WHERE instructors.professorID = :professorId AND lectures.name = :lectureTitle")
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
    @Query("SELECT lectures.* FROM lectures JOIN instructors ON instructors.lectureID = lectures.id " +
            "WHERE instructors.professorId = :professorId AND lectures.name = :lectureTitle AND " +
            "lectures.semesterYear = :semesterYear AND lectures.semesterSeason = :season")
    List<Lecture> getLecture(String professorId, String lectureTitle, int semesterYear, SemesterSeason season);



    /**
     * Inserts a comment into the local database.
     *
     * @param comment the selected comment
     */
    @Insert
    void insertComment(CommentModel comment);

    /**
     * Inserts comments, replacing existing entries with the same primary key.
     *
     * @param comments the comments to cache
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertComments(List<CommentModel> comments);

    /**
     * Removes all cached comments and replies.
     */
    @Query("DELETE FROM comments")
    void deleteComments();

    /**
     * Removes the cached comments and replies for a lecture offering.
     *
     * @param lectureId the identifier of the lecture offering
     */
    @Query("DELETE FROM comments WHERE lectureID = :lectureId")
    void deleteCommentsForLecture(String lectureId);

    /**
     * Replaces the cached comments for one lecture offering in a single transaction.
     *
     * @param lectureId the identifier of the lecture offering
     * @param comments the comments to cache
     */
    @Transaction
    default void replaceCommentsForLecture(String lectureId, List<CommentModel> comments) {
        deleteCommentsForLecture(lectureId);
        insertComments(comments);
    }


    /**
     * Finds a cached professor by identifier.
     *
     * @param id the unique identifier
     * @return the matching professor, or null if no entry exists
     */
    @Query("SELECT * FROM professors WHERE id = :id LIMIT 1")
    Professor getProfessorById(String id);
    /**
     * Returns top-level comments for a lecture, ordered by descending upvote count.
     *
     * @param lectureId the identifier of the lecture offering
     * @return the matching entries, or an empty list if none exist
     */
    @Query("SELECT * FROM comments WHERE lectureID = :lectureId AND parentID IS NULL ORDER BY upVotes DESC")
    List<CommentModel> getComments(String lectureId);

    /**
     * Returns replies to a comment, ordered by descending upvote count.
     *
     * @param parentId the identifier of the parent comment
     * @return the matching entries, or an empty list if none exist
     */
    @Query("SELECT * FROM comments WHERE parentID = :parentId ORDER BY upVotes DESC")
    List<CommentModel> getReplies(String parentId);

    /**
     * Inserts an association between a professor and a lecture offering.
     *
     * @param instructor the professor-to-lecture association
     */
    @Insert
    void insertInstructor(Instructor instructor);

    /**
     * Inserts instructor associations, replacing existing entries with the same primary key.
     *
     * @param instructors the associations between professors and lecture offerings
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertInstructors(List<Instructor> instructors);

    /**
     * Removes all cached instructor associations.
     */
    @Query("DELETE FROM instructors")
    void deleteInstructors();

    /**
     * Returns the cached ratings for a lecture offering and rater.
     *
     * @param lectureID the identifier of the lecture offering
     * @param rater whether the rating is a user rating or an aggregate
     * @return the matching entries, or an empty list if none exist
     */
    @Query("SELECT * from ratings WHERE lectureID = :lectureID AND rater = :rater")
    List<Rating> getLectureRatings(String lectureID, Rater rater);

    /**
     * Inserts a category rating or updates the existing entry with the same primary key.
     *
     * @param rating the category rating to store
     */
    @Upsert
    void upsertRating(Rating rating);

    /**
     * Removes the cached ratings for a lecture offering and rater.
     *
     * @param lectureId the identifier of the lecture offering
     * @param rater whether the rating is a user rating or an aggregate
     */
    @Query("DELETE FROM ratings WHERE lectureID = :lectureId AND rater = :rater")
    void deleteLectureRatings(String lectureId, Rater rater);

    /**
     * Replaces one lecture's cached ratings for the given rater in a single transaction.
     * This also clears stale values when the server returns fewer categories or no ratings.
     *
     * @param lectureId the identifier of the lecture offering
     * @param rater whether the rating is a user rating or an aggregate
     * @param ratings the ratings to cache
     */
    @Transaction
    default void replaceLectureRatings(String lectureId, Rater rater, List<Rating> ratings) {
        deleteLectureRatings(lectureId, rater);
        for (Rating rating : ratings) {
            upsertRating(rating);
        }
    }

    /**
     * Returns the cached lecture offerings with the specified title.
     *
     * @param lectureTitle the title of the lecture
     * @return the matching entries, or an empty list if none exist
     */
    @Query("SELECT * FROM lectures WHERE name = :lectureTitle")
    List<Lecture> getLecturesByTitle(String lectureTitle);

    /**
     * Updates the cached average rating for a lecture offering.
     *
     * @param lectureId the identifier of the lecture offering
     * @param averageRating the average rating
     */
    @Query("UPDATE lectures SET averageRating = :averageRating WHERE id = :lectureId")
    void updateLectureRating(String lectureId, double averageRating);

    /**
     * Updates the cached average rating for a professor.
     *
     * @param professorId the identifier of the professor
     * @param averageRating the average rating
     */
    @Query("UPDATE professors SET averageRating = :averageRating WHERE id = :professorId")
    void updateProfessorAverageRating(String professorId, double averageRating);
}
