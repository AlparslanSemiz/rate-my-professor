package com.pse.social.repository;


import com.pse.shared.enums.VoteType;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;

import com.pse.social.model.Comment;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface AnswerVoteRepository extends JpaRepository<AnswerVote, UUID>{


    Optional<AnswerVote> findByStudentAndAnswer(Student student, Answer answer);

    int countByAnswerAndVote(Answer answer, VoteType vote);

    /**
     * Answer votes are not cascaded from {@code Answer}, so deleting an answer without
     * clearing these first violates the foreign key.
     */
    @Modifying
    @Query("DELETE FROM AnswerVote vote WHERE vote.answer.id IN :answerIds")
    int deleteByAnswerIdIn(@Param("answerIds") Collection<UUID> answerIds);

}
