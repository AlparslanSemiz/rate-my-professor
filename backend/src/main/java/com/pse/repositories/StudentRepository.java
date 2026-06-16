package com.pse.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.Student;

public interface StudentRepository
        extends JpaRepository<Student, UUID> {

    Optional<Student> findByKitEmail(String kitEmail);

    boolean existsByKitEmail(String kitEmail);

}