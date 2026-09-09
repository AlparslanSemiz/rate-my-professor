package com.pse.rating.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.pse.rating.model.Rating;
import org.springframework.data.jpa.repository.Query;

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
    @Query("""
    SELECT r
    FROM Rating r
    WHERE r.lecture.id = :lectureId
      AND r.student.status = com.pse.user.model.StudentStatus.ACTIVE
    """)
    List<Rating> findActiveByLectureId(UUID lectureId);


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
