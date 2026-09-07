package com.pse.social.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.shared.enums.VoteType;
import com.pse.social.dto.request.VoteAnswerRequest;
import com.pse.social.dto.request.VoteCommentRequest;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.CommentVoteRepository;
import com.pse.user.model.Student;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Voting is the one write path in {@link SocialService} that is neither transactional nor
 * audited, and the row it produces carries a database constraint the method never checks.
 * These tests pin what it actually does -- including the four gaps recorded as findings --
 * rather than what a vote endpoint might be expected to do.
 *
 * <p>Scope is the two vote methods only, hence the file name; the submit and report paths
 * are a separate batch.
 */
@ExtendWith(MockitoExtension.class)
class SocialServiceVoteTests {

    private static final UUID COMMENT_ID = UUID.fromString("3f2504e0-4f89-11d3-9a0c-0305e82c3301");
    private static final UUID ANSWER_ID = UUID.fromString("7c9e6679-7425-40de-944b-e07fc1f90ae7");

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private CommentVoteRepository commentVoteRepository;

    @Mock
    private AnswerVoteRepository answerVoteRepository;

    private final Student student = new Student();
    private final Comment comment = new Comment();
    private final Answer answer = new Answer();

    /**
     * The five collaborators the vote methods never touch are passed as null rather than
     * mocked. A mock would let a later edit start using one of them without any test
     * noticing; a null turns that into an immediate failure in the tests that own these
     * methods. That the audit writer is among them is itself one of the findings.
     */
    private SocialService service() {
        return new SocialService(
                null,
                commentRepository,
                answerRepository,
                null,
                null,
                commentVoteRepository,
                answerVoteRepository,
                null,
                null
        );
    }

    // ---------- voteComment ----------

    @Test
    void voteComment_unknownComment_returnsAFailureWithoutTouchingTheVoteTable() {
        // Given
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.empty());

        // When
        BasicResponse response =
                service().voteComment(COMMENT_ID, student, new VoteCommentRequest(VoteType.UP));

        // Then
        assertThat(response.success()).isFalse();
        assertThat(response.message()).isEqualTo("Error, cannot find comment");
        verifyNoInteractions(commentVoteRepository);
    }

    @Test
    void voteComment_studentWhoHasNotVotedYet_createsAVoteWiredToTheStudentAndComment() {
        // Given
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(commentVoteRepository.findByStudentAndComment(student, comment))
                .thenReturn(Optional.empty());

        // When
        BasicResponse response =
                service().voteComment(COMMENT_ID, student, new VoteCommentRequest(VoteType.UP));

        // Then
        assertThat(response.success()).isTrue();
        assertThat(response.message()).isEqualTo("Comment vote saved successfully");
        ArgumentCaptor<CommentVote> saved = ArgumentCaptor.forClass(CommentVote.class);
        verify(commentVoteRepository).save(saved.capture());
        assertThat(saved.getValue().getStudent()).isSameAs(student);
        assertThat(saved.getValue().getComment()).isSameAs(comment);
        assertThat(saved.getValue().getVote()).isEqualTo(VoteType.UP);
    }

    /**
     * The table has a unique constraint on (student, comment), so changing a vote has to
     * update the row rather than insert a second one -- otherwise the second vote fails at
     * flush with a constraint violation the caller never sees coming.
     */
    @Test
    void voteComment_studentWhoAlreadyVoted_mutatesTheExistingRowRatherThanInsertingASecond() {
        // Given
        CommentVote existing = new CommentVote();
        existing.setStudent(student);
        existing.setComment(comment);
        existing.setVote(VoteType.UP);
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(commentVoteRepository.findByStudentAndComment(student, comment))
                .thenReturn(Optional.of(existing));

        // When
        service().voteComment(COMMENT_ID, student, new VoteCommentRequest(VoteType.DOWN));

        // Then
        ArgumentCaptor<CommentVote> saved = ArgumentCaptor.forClass(CommentVote.class);
        verify(commentVoteRepository).save(saved.capture());
        assertThat(saved.getValue()).isSameAs(existing);
        assertThat(existing.getVote()).isEqualTo(VoteType.DOWN);
    }

    /**
     * Characterization: there is no toggle-off. Voting up twice re-saves an up vote instead
     * of clearing it, and {@link VoteType} has no third value to clear it with -- so the
     * only way to withdraw a vote is a path that does not exist yet.
     */
    @Test
    void voteComment_repeatedIdenticalVote_isRewrittenRatherThanToggledOff() {
        // Given
        CommentVote existing = new CommentVote();
        existing.setStudent(student);
        existing.setComment(comment);
        existing.setVote(VoteType.UP);
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(commentVoteRepository.findByStudentAndComment(student, comment))
                .thenReturn(Optional.of(existing));

        // When
        BasicResponse response =
                service().voteComment(COMMENT_ID, student, new VoteCommentRequest(VoteType.UP));

        // Then
        assertThat(response.success()).isTrue();
        verify(commentVoteRepository).save(existing);
        assertThat(existing.getVote()).isEqualTo(VoteType.UP);
    }

    /**
     * Characterization: the vote type is never validated. A null reaches {@code setVote} and
     * is handed to {@code save}, so a malformed request is only stopped by the
     * {@code nullable = false} column -- at flush, outside any transaction this method
     * opened, which is not where the caller can act on it.
     */
    @Test
    void voteComment_nullVoteType_isSavedAsANullVoteRatherThanRejected() {
        // Given
        when(commentRepository.findById(COMMENT_ID)).thenReturn(Optional.of(comment));
        when(commentVoteRepository.findByStudentAndComment(student, comment))
                .thenReturn(Optional.empty());

        // When
        BasicResponse response =
                service().voteComment(COMMENT_ID, student, new VoteCommentRequest(null));

        // Then -- reported as a success
        assertThat(response.success()).isTrue();
        ArgumentCaptor<CommentVote> saved = ArgumentCaptor.forClass(CommentVote.class);
        verify(commentVoteRepository).save(saved.capture());
        assertThat(saved.getValue().getVote()).isNull();
    }

    // ---------- voteAnswer ----------

    @Test
    void voteAnswer_unknownAnswer_returnsAFailureWithoutTouchingTheVoteTable() {
        // Given
        when(answerRepository.findById(ANSWER_ID)).thenReturn(Optional.empty());

        // When
        BasicResponse response =
                service().voteAnswer(ANSWER_ID, student, new VoteAnswerRequest(VoteType.UP));

        // Then -- note the capital A, unlike the comment path's message
        assertThat(response.success()).isFalse();
        assertThat(response.message()).isEqualTo("Error, cannot find Answer");
        verifyNoInteractions(answerVoteRepository);
    }

    /** The answer path has to reach the answer vote table, not the comment one. */
    @Test
    void voteAnswer_studentWhoHasNotVotedYet_createsAVoteWiredToTheStudentAndAnswer() {
        // Given
        when(answerRepository.findById(ANSWER_ID)).thenReturn(Optional.of(answer));
        when(answerVoteRepository.findByStudentAndAnswer(student, answer))
                .thenReturn(Optional.empty());

        // When
        BasicResponse response =
                service().voteAnswer(ANSWER_ID, student, new VoteAnswerRequest(VoteType.DOWN));

        // Then
        assertThat(response.success()).isTrue();
        assertThat(response.message()).isEqualTo("Answer vote saved successfully");
        ArgumentCaptor<AnswerVote> saved = ArgumentCaptor.forClass(AnswerVote.class);
        verify(answerVoteRepository).save(saved.capture());
        assertThat(saved.getValue().getStudent()).isSameAs(student);
        assertThat(saved.getValue().getAnswer()).isSameAs(answer);
        assertThat(saved.getValue().getVote()).isEqualTo(VoteType.DOWN);
        verify(commentVoteRepository, never()).save(any());
    }

    @Test
    void voteAnswer_studentWhoAlreadyVoted_mutatesTheExistingRowRatherThanInsertingASecond() {
        // Given
        AnswerVote existing = new AnswerVote();
        existing.setStudent(student);
        existing.setAnswer(answer);
        existing.setVote(VoteType.DOWN);
        when(answerRepository.findById(ANSWER_ID)).thenReturn(Optional.of(answer));
        when(answerVoteRepository.findByStudentAndAnswer(student, answer))
                .thenReturn(Optional.of(existing));

        // When
        service().voteAnswer(ANSWER_ID, student, new VoteAnswerRequest(VoteType.UP));

        // Then
        ArgumentCaptor<AnswerVote> saved = ArgumentCaptor.forClass(AnswerVote.class);
        verify(answerVoteRepository).save(saved.capture());
        assertThat(saved.getValue()).isSameAs(existing);
        assertThat(existing.getVote()).isEqualTo(VoteType.UP);
    }

    /** Same missing validation as the comment path. */
    @Test
    void voteAnswer_nullVoteType_isSavedAsANullVoteRatherThanRejected() {
        // Given
        when(answerRepository.findById(ANSWER_ID)).thenReturn(Optional.of(answer));
        when(answerVoteRepository.findByStudentAndAnswer(student, answer))
                .thenReturn(Optional.empty());

        // When
        BasicResponse response =
                service().voteAnswer(ANSWER_ID, student, new VoteAnswerRequest(null));

        // Then
        assertThat(response.success()).isTrue();
        ArgumentCaptor<AnswerVote> saved = ArgumentCaptor.forClass(AnswerVote.class);
        verify(answerVoteRepository).save(saved.capture());
        assertThat(saved.getValue().getVote()).isNull();
    }
}
