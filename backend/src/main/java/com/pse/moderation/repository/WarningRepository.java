package com.pse.moderation.repository;



import java.util.List;
import java.util.UUID;

import com.pse.moderation.model.Warning;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;


public interface WarningRepository extends JpaRepository<Warning, UUID> {


    List<Warning> findByStudent(Student student);

}