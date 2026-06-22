package com.pse.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.Student;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface StudentRepository
        extends JpaRepository<Student, UUID> {

    Optional<Student> findByKitEmail(String kitEmail);

    boolean existsByKitEmail(String kitEmail);


    String findEmailByStudent(Student student);


    @Modifying
    @Transactional
    @Query("UPDATE Student s SET s.deleted = true WHERE s.kitEmail = :email")
    void softDeleteByKitEmail(@Param("email") String email);
}