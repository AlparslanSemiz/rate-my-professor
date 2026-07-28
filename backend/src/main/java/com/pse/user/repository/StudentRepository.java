package com.pse.user.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

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



}