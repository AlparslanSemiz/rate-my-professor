package com.pse.lecture.repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.lecture.model.Lecture;

public interface LectureRepository extends JpaRepository<Lecture, UUID> {


    Set<Lecture> findByActiveTrueOrderByNameAsc();
    Set<Lecture> findAllByOrderByNameAsc();
    Optional<Lecture> findByName(String name);
}