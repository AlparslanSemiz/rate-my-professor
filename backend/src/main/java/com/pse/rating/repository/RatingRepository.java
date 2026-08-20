package com.pse.rating.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.pse.rating.model.Rating;

public interface RatingRepository
        extends JpaRepository<Rating, UUID>, JpaSpecificationExecutor<Rating> {

    List<Rating> findByLectureId(UUID lectureId);

    List<Rating> findAllByOrderByCreatedAtDesc();

    Optional<Rating> findByStudentIdAndLectureId(
            UUID studentId,
            UUID lectureId
    );
    
}