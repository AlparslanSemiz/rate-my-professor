package com.pse.social.repository;



import com.pse.social.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;


public interface CommentRepository extends JpaRepository<Comment, UUID> {


}



