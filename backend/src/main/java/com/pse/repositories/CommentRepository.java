package com.pse.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.social.Comment;

public interface CommentRepository
        extends JpaRepository<Comment, UUID> {

    List<Comment> findByLectureId(UUID lectureId);

}