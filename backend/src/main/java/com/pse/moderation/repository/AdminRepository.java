package com.pse.moderation.repository;


import java.util.Optional;
import java.util.UUID;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pse.moderation.model.Admin;
import com.pse.user.model.Student;

public interface AdminRepository extends JpaRepository<Admin, UUID> {

    boolean existsByStudent(Student student);

    Optional<Admin> findByStudent(Student student);

    /** Student ids of every administrator, for resolving roles without a query per row. */
    @Query("SELECT admin.student.id FROM Admin admin")
    List<UUID> findAllAdminStudentIds();

}