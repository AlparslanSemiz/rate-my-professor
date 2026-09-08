package com.pse.social.mapper;

import java.util.List;

import com.pse.shared.enums.ContentStatus;
import com.pse.shared.enums.VoteType;
import com.pse.shared.util.ProfilePictureGenerator;
import com.pse.social.dto.response.AnswerResponse;
import com.pse.social.dto.response.CommentResponse;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentVoteRepository;
import com.pse.user.model.Student;
import org.springframework.stereotype.Component;

/**
 * Comments and answers as the student app reads them, tallies and the caller's own vote
 * included.
 *
 * <p>A {@code @Component} rather than a static holder, unlike the other mappers here: this one
 * has to count votes, so it genuinely needs the two vote repositories.
 *
 * <p>Lifted out of {@code SocialService}, where the two builders were {@code public} for no
 * reason production code ever used -- their only callers outside the class were its own tests.
 */
@Component
public class SocialResponseMapper {

    private final CommentVoteRepository commentVoteRepository;
    private final AnswerVoteRepository answerVoteRepository;

    public SocialResponseMapper(
            CommentVoteRepository commentVoteRepository,
            AnswerVoteRepository answerVoteRepository
    ) {
        this.commentVoteRepository = commentVoteRepository;
        this.answerVoteRepository = answerVoteRepository;
    }

    /** @param student the caller, or {@code null} for the unauthenticated sync route */
    public CommentResponse toResponse(Comment comment, Student student) {

        VoteType userVote = null;
        if (student != null) {
            CommentVote vote = commentVoteRepository
                    .findByStudentAndComment(student, comment)
                    .orElse(null);
            if (vote != null) {
                userVote = vote.getVote();
            }
        }

        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getStatus(),
                comment.getStudent().getUsername(),
                ProfilePictureGenerator.generateProfilePicture(comment.getStudent()),
                comment.getLecture().getId(),
                comment.getCreatedAt(),
                commentVoteRepository.countByCommentAndVote(comment, VoteType.DOWN),
                commentVoteRepository.countByCommentAndVote(comment, VoteType.UP),
                userVote,
                answersOf(comment, student)
        );
    }

    public AnswerResponse toResponse(Answer answer, Student student) {

        VoteType userVote = null;
        if (student != null) {
            AnswerVote vote = answerVoteRepository
                    .findByStudentAndAnswer(student, answer)
                    .orElse(null);
            if (vote != null) {
                userVote = vote.getVote();
            }
        }

        return new AnswerResponse(
                answer.getId(),
                answer.getContent(),
                answer.getStatus(),
                answer.getStudent().getUsername(),
                ProfilePictureGenerator.generateProfilePicture(answer.getStudent()),
                answer.getCreatedAt(),
                answerVoteRepository.countByAnswerAndVote(answer, VoteType.DOWN),
                answerVoteRepository.countByAnswerAndVote(answer, VoteType.UP),
                userVote
        );
    }

    /**
     * Hidden answers must not reach students once an admin has resolved a report against
     * them as {@code ACTION_TAKEN}, mirroring the comment filter the callers apply.
     */
    private List<AnswerResponse> answersOf(Comment comment, Student student) {
        return comment.getAnswers().stream()
                .filter(answer -> answer.getStatus() == ContentStatus.VISIBLE)
                .map(answer -> toResponse(answer, student))
                .toList();
    }
}
