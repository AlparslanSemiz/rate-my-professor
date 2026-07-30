package com.pse.social.repository;



import com.pse.shared.enums.ContentStatus;
import com.pse.social.model.Comment;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;


public interface CommentRepository extends JpaRepository<Comment, UUID> {


    List<Comment> findAllByLectureId(UUID lectureId);

    List<Comment> findAllByLectureIdAndStatus(UUID lectureId, ContentStatus status);

    List<Comment> findAllByStudent(Student student);

    @EntityGraph(attributePaths = {"student", "lecture"})
    List<Comment> findAllByOrderByCreatedAtDesc();
}



