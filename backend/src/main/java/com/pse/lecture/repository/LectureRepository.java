package com.pse.lecture.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.lecture.model.Lecture;

public interface LectureRepository extends JpaRepository<Lecture, UUID> {


    List<Lecture> findByActiveTrueOrderByNameAsc();
    Optional<Lecture> findByName(String name);
}