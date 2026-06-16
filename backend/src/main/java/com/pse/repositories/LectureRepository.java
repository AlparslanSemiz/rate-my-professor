package com.pse.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.Lecture;

public interface LectureRepository
        extends JpaRepository<Lecture, UUID> {

    List<Lecture> findByProfessorId(UUID professorId);

}