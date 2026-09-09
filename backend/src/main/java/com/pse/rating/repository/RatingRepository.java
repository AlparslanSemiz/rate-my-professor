package com.pse.rating.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.pse.rating.model.Rating;

/**
 * Defines RatingRepository.
 */
public interface RatingRepository
        extends JpaRepository<Rating, UUID>, JpaSpecificationExecutor<Rating> {

    /**
     * Returns findByLectureId.
     *
     * @param lectureId the lectureId
     * @return the result
     */
    List<Rating> findByLectureId(UUID lectureId);


    /**
     * Returns findByStudentIdAndLectureId.
     *
     * @param studentId the studentId
     * @param lectureId the lectureId
     * @return the result
     */
    Optional<Rating> findByStudentIdAndLectureId(
            UUID studentId,
            UUID lectureId
    );
    
}
