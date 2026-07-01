package com.pse.user.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pse.rating.model.Rating;
import com.pse.user.model.Student;

public interface StudentRepository
        extends JpaRepository<Student, UUID> {

    Optional<Student> findByKitEmail(String kitEmail);



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