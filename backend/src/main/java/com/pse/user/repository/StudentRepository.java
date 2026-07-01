package com.pse.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pse.user.model.Student;

/**
 * Acts an direct interface to the
 */
public interface StudentRepository extends JpaRepository<Student, UUID> {

    /**
     * Finds the User by their KIT-Email address.
     * @param kitEmail e.g. uabcd@student.kit.edu
     * @return the User referenced to that email (if found)
     */
    Optional<Student> findByKitEmail(String kitEmail);


    /**
     * Returns the Average of all Ratings of the User (only average of "overall" field).
     * @param student references the User
     * @return average of overall fields
     */
    @Query("""
        SELECT AVG(rt.value)
        FROM RatingTopic rt
        WHERE rt.rating.student = :student
          AND rt.name = 'Overall'
    """)
    Double getAverageOverallRating(@Param("student") Student student);


}