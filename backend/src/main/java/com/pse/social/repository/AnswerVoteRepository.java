package com.pse.social.repository;


import com.pse.shared.enums.VoteType;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;

import com.pse.social.model.Comment;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnswerVoteRepository extends JpaRepository<AnswerVote, UUID>{


    Optional<AnswerVote> findByStudentAndAnswer(Student student, Answer answer);

    int countByAnswerAndVote(Answer answer, VoteType vote);

}
