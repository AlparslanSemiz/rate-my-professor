package com.pse.lecture.repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.lecture.model.Lecture;

/**
 * Defines LectureRepository.
 */
public interface LectureRepository extends JpaRepository<Lecture, UUID> {


    /**
     * Returns findByActiveTrueOrderByNameAsc.
     *
     * @return the result
     */
    Set<Lecture> findByActiveTrueOrderByNameAsc();
    /**
     * Returns findAllByOrderByNameAsc.
     *
     * @return the result
     */
    Set<Lecture> findAllByOrderByNameAsc();
    /**
     * Returns findByName.
     *
     * @param name the name
     * @return the result
     */
    Optional<Lecture> findByName(String name);
}
