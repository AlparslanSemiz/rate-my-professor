package com.pse.social.repository;



import com.pse.social.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;


public interface CommentRepository extends JpaRepository<Comment, UUID> {


    List<Comment> findAllByLectureId(UUID lectureId);
}



