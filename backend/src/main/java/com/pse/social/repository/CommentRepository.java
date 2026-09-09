package com.pse.social.repository;



import com.pse.shared.enums.ContentStatus;
import com.pse.social.model.Comment;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;


/**
 * Defines CommentRepository.
 */
public interface CommentRepository extends JpaRepository<Comment, UUID> {


    /**
     * Returns findAllByLectureId.
     *
     * @param lectureId the lectureId
     * @return the result
     */
    List<Comment> findAllByLectureId(UUID lectureId);

    /**
     * Returns findAllByLectureIdAndStatus.
     *
     * @param lectureId the lectureId
     * @param status the status
     * @return the result
     */
    List<Comment> findAllByLectureIdAndStatus(UUID lectureId, ContentStatus status);

    /**
     * Returns findAllByStudent.
     *
     * @param student the student
     * @return the result
     */
    List<Comment> findAllByStudent(Student student);

    /**
     * Returns findAllByStatus.
     *
     * @param status the status
     * @return the result
     */
    @EntityGraph(attributePaths = {"student", "lecture"})
    List<Comment> findAllByStatus(ContentStatus status);

    /**
     * Returns findAllByOrderByCreatedAtDesc.
     *
     * @return the result
     */
    @EntityGraph(attributePaths = {"student", "lecture"})
    List<Comment> findAllByOrderByCreatedAtDesc();
}



