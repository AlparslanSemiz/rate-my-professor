package com.pse.social.repository;


import com.pse.shared.enums.VoteType;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommentVoteRepository extends JpaRepository<CommentVote, UUID>{


    Optional<CommentVote> findByStudentAndComment(Student student, Comment comment);


    int countByCommentAndVote(Comment comment, VoteType vote);
}
