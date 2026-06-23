package com.pse.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.pse.rating.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface StudentRepository
        extends JpaRepository<Student, UUID> {

    Optional<Student> findByKitEmail(String kitEmail);



    String findEmailByStudent(Student student);


    @Modifying
    @Transactional
    @Query("UPDATE Student s SET s.deleted = true WHERE s.kitEmail = :email")
    void softDeleteByKitEmail(@Param("email") String email);


    @Query("""
        SELECT AVG(rt.value)
        FROM RatingTopic rt
        WHERE rt.rating.student = :student
          AND rt.name = 'Overall'
    """)
    Double getAverageOverallRating(@Param("student") Student student);


    @Query("""
    SELECT DISTINCT r
    FROM Rating r
    LEFT JOIN FETCH r.topics
    LEFT JOIN FETCH r.lecture
    WHERE r.student.id = :studentId
""")
    List<Rating> findAllByStudentIdWithTopics(UUID studentId);

}