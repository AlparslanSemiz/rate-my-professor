package com.pse.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.Rating;

public interface RatingRepository
        extends JpaRepository<Rating, UUID> {

    List<Rating> findByLectureId(UUID lectureId);

    Optional<Rating> findByStudentIdAndLectureId(
            UUID studentId,
            UUID lectureId
    );
}