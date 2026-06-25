package com.pse.moderation.repository;


import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.moderation.model.Admin;
import com.pse.user.model.Student;

public interface AdminRepository extends JpaRepository<Admin, UUID> {

    boolean existsByStudent(Student student);

    Optional<Admin> findByStudent(Student student);


}