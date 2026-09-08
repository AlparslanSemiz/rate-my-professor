package com.pse.social;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.shared.enums.NotificationType;
import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.VoteType;
import com.pse.social.dto.request.*;
import com.pse.social.dto.response.NotificationsResponse;
import com.pse.social.model.*;
import com.pse.social.repository.*;
import com.pse.social.service.SocialService;
import com.pse.shared.error.ApiException;
import com.pse.user.model.Student;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import com.pse.social.dto.response.CommentResponse;
import com.pse.shared.enums.ContentStatus;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialServiceTests {

    @Mock
    private LectureService lectureService;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private CommentReportRepository commentReportRepository;

    @Mock
    private AnswerReportRepository answerReportRepository;

    @Mock
    private CommentVoteRepository commentVoteRepository;

    @Mock
    private AnswerVoteRepository answerVoteRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AuditWriter auditWriter;

    @InjectMocks
    private SocialService socialService;



    @Test
    void submitCommentUnknownLectureIsNotFound() {

        Student student = mock(Student.class);

        CommentSubmitRequest request = mock(CommentSubmitRequest.class);

        when(request.lectureID()).thenReturn(
                UUID.randomUUID().toString()
        );

        when(request.content())
                .thenReturn("Great lecture");

        when(lectureService.getLectureByID(
                request.lectureID()
        )).thenReturn(null);


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.submitComment(
                        student,
                        request
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(thrown.getMessage()).isEqualTo("Lecture not found");

        verify(commentRepository, never()).save(any());

        verifyNoInteractions(auditWriter);
    }


    @Test
    void submitCommentSavesCommentAndWritesAudit() {

        Student student = mock(Student.class);

        Lecture lecture = mock(Lecture.class);

        CommentSubmitRequest request = mock(CommentSubmitRequest.class);

        String lectureId = UUID.randomUUID().toString();

        when(request.lectureID())
                .thenReturn(lectureId);

        when(request.content())
                .thenReturn("Great lecture");

        when(lectureService.getLectureByID(lectureId))
                .thenReturn(lecture);

        when(lecture.getCode()).thenReturn("CS101");
        when(lecture.getName()).thenReturn("Algorithms");


        BasicResponse response =
                socialService.submitComment(
                        student,
                        request
                );


        assertThat(response.success()).isTrue();

        assertThat(response.message()).isEqualTo("Comment submitted successfully");


        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);

        verify(commentRepository).save(captor.capture());

        Comment saved = captor.getValue();

        assertThat(saved.getStudent()).isSameAs(student);
        assertThat(saved.getLecture()).isSameAs(lecture);
        assertThat(saved.getContent()).isEqualTo("Great lecture");


        verify(auditWriter)
                .writeStudentAction(
                        eq(student),
                        eq(AuditAction.COMMENT_CREATED),
                        eq(AuditTargetType.COMMENT),
                        nullable(UUID.class),
                        eq("CS101 — Algorithms"),
                        anyMap()
                );
    }


    @Test
    void voteCommentUnknownCommentIsNotFound() {

        UUID commentId = UUID.randomUUID();

        Student student = mock(Student.class);

        VoteCommentRequest request = mock(VoteCommentRequest.class);

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.empty());


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.voteComment(
                        commentId,
                        student,
                        request
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(thrown.getMessage()).isEqualTo("Comment not found");

        verify(commentVoteRepository, never()).save(any());
    }


    @Test
    void voteCommentCreatesVoteWhenStudentHasNotVotedBefore() {

        UUID commentId = UUID.randomUUID();

        Student student = mock(Student.class);
        Comment comment = mock(Comment.class);

        VoteCommentRequest request = mock(VoteCommentRequest.class);

        when(request.voteType())
                .thenReturn(VoteType.UP);

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.of(comment));

        when(commentVoteRepository
                .findByStudentAndComment(
                        student,
                        comment
                ))
                .thenReturn(Optional.empty());

        when(comment.getStudent())
                .thenReturn(mock(Student.class));

        when(comment.getLecture())
                .thenReturn(mock(Lecture.class));



        BasicResponse response =
                socialService.voteComment(
                        commentId,
                        student,
                        request
                );


        assertThat(response.success()).isTrue();


        ArgumentCaptor<CommentVote> captor =
                ArgumentCaptor.forClass(
                        CommentVote.class
                );

        verify(commentVoteRepository).save(captor.capture());


        CommentVote vote = captor.getValue();

        assertThat(vote.getStudent()).isSameAs(student);
        assertThat(vote.getComment()).isSameAs(comment);
        assertThat(vote.getVote()).isEqualTo(VoteType.UP);
    }


    @Test
    void voteCommentUpdatesExistingVote() {

        UUID commentId = UUID.randomUUID();

        Student student = mock(Student.class);
        Comment comment = mock(Comment.class);

        CommentVote existingVote = mock(CommentVote.class);

        VoteCommentRequest request = mock(VoteCommentRequest.class);

        when(request.voteType())
                .thenReturn(VoteType.DOWN);

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.of(comment));

        when(commentVoteRepository
                .findByStudentAndComment(
                        student,
                        comment
                ))
                .thenReturn(
                        Optional.of(existingVote)
                );

        when(comment.getStudent())
                .thenReturn(mock(Student.class));

        when(comment.getLecture())
                .thenReturn(mock(Lecture.class));



        BasicResponse response =
                socialService.voteComment(
                        commentId,
                        student,
                        request
                );


        assertThat(response.success()).isTrue();

        verify(existingVote).setVote(VoteType.DOWN);

        verify(commentVoteRepository).save(existingVote);
    }



    @Test
    void submitAnswerUnknownCommentIsNotFound() {

        Student student = mock(Student.class);

        AnswerSubmitRequest request = mock(AnswerSubmitRequest.class);

        UUID commentId = UUID.randomUUID();

        when(request.commentID())
                .thenReturn(commentId.toString());

        when(request.content())
                .thenReturn("My answer");

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.empty());


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.submitAnswer(
                        student,
                        request
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(thrown.getMessage()).isEqualTo("Comment not found");

        verify(answerRepository, never()).save(any());

        verify(notificationRepository, never()).save(any());
    }


    @Test
    void submitAnswerCreatesAnswerAndNotification() {

        Student answerAuthor = mock(Student.class);
        Student commentAuthor = mock(Student.class);

        Comment comment = mock(Comment.class);
        Lecture lecture = mock(Lecture.class);

        AnswerSubmitRequest request = mock(AnswerSubmitRequest.class);

        UUID commentId = UUID.randomUUID();

        when(request.commentID())
                .thenReturn(commentId.toString());

        when(request.content())
                .thenReturn("Helpful answer");

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.of(comment));

        when(comment.getStudent())
                .thenReturn(commentAuthor);

        when(comment.getLecture())
                .thenReturn(lecture);

        when(commentAuthor.getUsername())
                .thenReturn("commentAuthor");

        when(lecture.getCode())
                .thenReturn("LA1");

        when(lecture.getName())
                .thenReturn("Lineare Algebra 1");


        BasicResponse response =
                socialService.submitAnswer(
                        answerAuthor,
                        request
                );


        assertThat(response.success()).isTrue();

        assertThat(response.message()).isEqualTo("Answer submitted successfully");


        ArgumentCaptor<Answer> answerCaptor =
                ArgumentCaptor.forClass(Answer.class);

        verify(answerRepository)
                .save(answerCaptor.capture());

        Answer answer =
                answerCaptor.getValue();

        assertThat(answer.getStudent()).isSameAs(answerAuthor);

        assertThat(answer.getComment()).isSameAs(comment);

        assertThat(answer.getContent()).isEqualTo("Helpful answer");


        ArgumentCaptor<Notification> notificationCaptor =
                ArgumentCaptor.forClass(
                        Notification.class
                );

        verify(notificationRepository)
                .save(notificationCaptor.capture());


        Notification notification =
                notificationCaptor.getValue();

        assertThat(notification.getRecipient()).isSameAs(commentAuthor);

        assertThat(notification.getLecture()).isSameAs(lecture);

        assertThat(notification.getOwnComment()).isSameAs(comment);

        assertThat(notification.getAnswer()).isSameAs(answer);

        assertThat(notification.getType()).isEqualTo(NotificationType.ANSWER);


        verify(auditWriter)
                .writeStudentAction(
                        eq(answerAuthor),
                        eq(AuditAction.ANSWER_CREATED),
                        eq(AuditTargetType.ANSWER),
                        nullable(UUID.class),
                        eq(
                                "Answer to commentAuthor "
                                        + "in LA1 — Lineare Algebra 1"
                        ),
                        anyMap()
                );
    }


    @Test
    void voteAnswerUnknownAnswerIsNotFound() {

        UUID answerId = UUID.randomUUID();

        Student student = mock(Student.class);

        VoteAnswerRequest request = mock(VoteAnswerRequest.class);

        when(answerRepository.findById(answerId))
                .thenReturn(Optional.empty());


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.voteAnswer(
                        answerId,
                        student,
                        request
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(thrown.getMessage()).isEqualTo("Answer not found");

        verify(answerVoteRepository, never()).save(any());
    }


    @Test
    void voteAnswerUpdatesExistingVote() {

        UUID answerId = UUID.randomUUID();

        Student student = mock(Student.class);
        Answer answer = mock(Answer.class);

        AnswerVote existingVote = mock(AnswerVote.class);

        VoteAnswerRequest request = mock(VoteAnswerRequest.class);

        when(request.voteType())
                .thenReturn(VoteType.DOWN);

        when(answerRepository.findById(answerId))
                .thenReturn(Optional.of(answer));

        when(answerVoteRepository
                .findByStudentAndAnswer(
                        student,
                        answer
                ))
                .thenReturn(
                        Optional.of(existingVote)
                );

        Comment votedComment = mock(Comment.class);

        when(votedComment.getLecture())
                .thenReturn(mock(Lecture.class));

        when(answer.getStudent())
                .thenReturn(mock(Student.class));

        when(answer.getComment())
                .thenReturn(votedComment);



        BasicResponse response =
                socialService.voteAnswer(
                        answerId,
                        student,
                        request
                );


        assertThat(response.success()).isTrue();

        verify(existingVote).setVote(VoteType.DOWN);

        verify(answerVoteRepository).save(existingVote);
    }


    @Test
    void submitCommentReportUnknownCommentIsNotFound() {

        Student student = mock(Student.class);

        CommentReportRequest request = mock(CommentReportRequest.class);

        UUID commentId = UUID.randomUUID();

        when(request.commentID())
                .thenReturn(commentId.toString());

        when(request.reportReason())
                .thenReturn(ReportReason.HARASSMENT);

        when(request.explanation())
                .thenReturn("Rude");

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.empty());


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.submitCommentReport(
                        student,
                        request
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        verify(commentReportRepository, never()).save(any());
    }


    @Test
    void submitCommentReportSavesReport() {

        Student reporter = mock(Student.class);
        Student author = mock(Student.class);

        Comment comment = mock(Comment.class);
        Lecture lecture = mock(Lecture.class);

        CommentReportRequest request = mock(CommentReportRequest.class);

        UUID commentId = UUID.randomUUID();

        when(request.commentID())
                .thenReturn(commentId.toString());

        when(request.reportReason())
                .thenReturn(ReportReason.HARASSMENT);

        when(request.explanation())
                .thenReturn("Rude");

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.of(comment));

        when(comment.getStudent())
                .thenReturn(author);

        when(author.getUsername())
                .thenReturn("author");

        when(comment.getLecture())
                .thenReturn(lecture);

        when(lecture.getCode())
                .thenReturn("LA1");

        when(lecture.getName())
                .thenReturn("Lineare Algebra 1");


        BasicResponse response =
                socialService.submitCommentReport(
                        reporter,
                        request
                );


        assertThat(response.success()).isTrue();


        ArgumentCaptor<CommentReport> captor =
                ArgumentCaptor.forClass(
                        CommentReport.class
                );

        verify(commentReportRepository).save(captor.capture());


        CommentReport report =
                captor.getValue();

        assertThat(report.getReporter()).isSameAs(reporter);
        assertThat(report.getComment()).isSameAs(comment);

        assertThat(report.getReason()).isEqualTo(ReportReason.HARASSMENT);

        assertThat(report.getExplanation()).isEqualTo("Rude");


        verify(auditWriter)
                .writeStudentAction(
                        eq(reporter),
                        eq(AuditAction.COMMENT_REPORT_CREATED),
                        eq(AuditTargetType.COMMENT_REPORT),
                        nullable(UUID.class),
                        eq(
                                "Report about author "
                                        + "in LA1 — Lineare Algebra 1"
                        ),
                        anyMap()
                );
    }


    @Test
    void submitAnswerReportUnknownAnswerIsNotFound() {

        Student student = mock(Student.class);

        AnswerReportRequest request = mock(AnswerReportRequest.class);

        UUID answerId = UUID.randomUUID();

        when(request.answerID())
                .thenReturn(answerId.toString());

        when(request.reportReason())
                .thenReturn(ReportReason.HARASSMENT);

        when(request.explanation())
                .thenReturn("Rude");

        when(answerRepository.findById(answerId))
                .thenReturn(Optional.empty());


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.submitAnswerReport(
                        student,
                        request
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        verify(answerReportRepository, never()).save(any());
    }



    @Test
    void getNotificationsReturnsWarningNotification() {

        Student student = mock(Student.class);

        Notification notification = mock(Notification.class);

        UUID notificationId = UUID.randomUUID();

        LocalDateTime createdAt = LocalDateTime.now();

        when(notificationRepository
                .findAllByRecipientAndSeenFalseOrderByCreatedAtDesc(
                        student
                ))
                .thenReturn(List.of(notification));

        when(notification.getId())
                .thenReturn(notificationId);

        when(notification.getType())
                .thenReturn(NotificationType.WARNING);

        when(notification.getMessage())
                .thenReturn("Please behave");

        when(notification.getCreatedAt())
                .thenReturn(createdAt);


        NotificationsResponse response = socialService.getNotifications(student);


        assertThat(response.success()).isTrue();

        assertThat(response.message()).isEqualTo("Found: 1 Notifications");

        assertThat(response.notifications().size()).isEqualTo(1);

        assertThat(response.notifications()
                        .get(0)
                        .type()).isEqualTo(NotificationType.WARNING);

        assertThat(response.notifications()
                        .get(0)
                        .message()).isEqualTo("Please behave");
    }


    @Test
    void markNotificationAsSeenForeignNotificationIsNotFound() {

        Student student = mock(Student.class);

        UUID notificationId = UUID.randomUUID();

        when(notificationRepository
                .findByRecipientAndId(
                        student,
                        notificationId
                ))
                .thenReturn(Optional.empty());


        ApiException thrown = catchThrowableOfType(ApiException.class, () -> socialService.markNotificationAsSeen(
                        student,
                        notificationId
                ));
        assertThat(thrown).as("nothing was thrown").isNotNull();


        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);

        assertThat(thrown.getMessage()).isEqualTo("Notification not found");
    }


    @Test
    void markNotificationAsSeenMarksNotification() {

        Student student = mock(Student.class);

        Notification notification = mock(Notification.class);

        UUID notificationId = UUID.randomUUID();

        when(notificationRepository
                .findByRecipientAndId(
                        student,
                        notificationId
                ))
                .thenReturn(
                        Optional.of(notification)
                );


        BasicResponse response =
                socialService.markNotificationAsSeen(
                        student,
                        notificationId
                );


        assertThat(response.success()).isTrue();

        assertThat(response.message()).isEqualTo("Marked Notifications as seen");

        verify(notification).setSeen(true);
    }

    // ------------------------------------------------------- the response builders, batch 7

    /**
     * {@code userVote} is the field the app colours the vote arrows from, and it has three
     * states that look alike from the outside: nobody is signed in, the reader has not voted,
     * and the reader has. Only the third produces a value, and the first two must produce null
     * without asking the vote table anything it cannot answer.
     */
    @Test
    void aCommentReadAnonymouslyCarriesNoUserVote() {
        Comment comment = comment(ContentStatus.VISIBLE);

        CommentResponse response = socialService.createCommentResponse(comment, null);

        assertThat(response.userVote()).isNull();
        verify(commentVoteRepository, never()).findByStudentAndComment(any(), any());
    }

    @Test
    void aCommentReadBySomeoneWhoHasNotVotedCarriesNoUserVote() {
        Comment comment = comment(ContentStatus.VISIBLE);
        Student reader = student();
        when(commentVoteRepository.findByStudentAndComment(reader, comment))
                .thenReturn(Optional.empty());

        assertThat(socialService.createCommentResponse(comment, reader).userVote()).isNull();
    }

    @Test
    void aCommentReadBySomeoneWhoHasVotedCarriesTheirVote() {
        Comment comment = comment(ContentStatus.VISIBLE);
        Student reader = student();
        CommentVote vote = new CommentVote();
        vote.setVote(VoteType.UP);
        when(commentVoteRepository.findByStudentAndComment(reader, comment))
                .thenReturn(Optional.of(vote));

        assertThat(socialService.createCommentResponse(comment, reader).userVote())
                .isEqualTo(VoteType.UP);
    }

    @Test
    void anAnswerReadAnonymouslyCarriesNoUserVote() {
        Answer answer = answer(ContentStatus.VISIBLE);

        assertThat(socialService.createAnswerResponse(answer, null).userVote()).isNull();
        verify(answerVoteRepository, never()).findByStudentAndAnswer(any(), any());
    }

    @Test
    void anAnswerReadBySomeoneWhoHasNotVotedCarriesNoUserVote() {
        Answer answer = answer(ContentStatus.VISIBLE);
        Student reader = student();
        when(answerVoteRepository.findByStudentAndAnswer(reader, answer))
                .thenReturn(Optional.empty());

        assertThat(socialService.createAnswerResponse(answer, reader).userVote()).isNull();
    }

    @Test
    void anAnswerReadBySomeoneWhoHasVotedCarriesTheirVote() {
        Answer answer = answer(ContentStatus.VISIBLE);
        Student reader = student();
        AnswerVote vote = new AnswerVote();
        vote.setVote(VoteType.DOWN);
        when(answerVoteRepository.findByStudentAndAnswer(reader, answer))
                .thenReturn(Optional.of(vote));

        assertThat(socialService.createAnswerResponse(answer, reader).userVote())
                .isEqualTo(VoteType.DOWN);
    }

    /**
     * An answer an administrator has hidden must not reach a student, the same way a hidden
     * comment does not. The filter is on the answer's own status, so a visible comment can still
     * carry hidden answers -- which is the case that would leak if this branch went untested.
     */
    @Test
    void hiddenAnswersAreLeftOutOfAVisibleComment() {
        Comment comment = comment(ContentStatus.VISIBLE);
        Answer visible = answer(ContentStatus.VISIBLE);
        Answer hidden = answer(ContentStatus.HIDDEN);
        comment.setAnswers(List.of(visible, hidden));

        CommentResponse response = socialService.createCommentResponse(comment, null);

        assertThat(response.answers()).hasSize(1);
        // AnswerResponse names its first component commentID, but it is filled with the
        // answer's id -- a misleading name in a client-visible contract, left alone here.
        assertThat(response.answers().getFirst().commentID()).isEqualTo(visible.getId());
    }

    private static Student student() {
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setUsername("ada");
        return student;
    }

    private static Comment comment(ContentStatus status) {
        Lecture lecture = new Lecture();
        lecture.setId(UUID.randomUUID());
        lecture.setName("Algorithmen 1");

        Comment comment = new Comment();
        comment.setId(UUID.randomUUID());
        comment.setContent("Great lecture");
        comment.setStatus(status);
        comment.setStudent(student());
        comment.setLecture(lecture);
        comment.setCreatedAt(LocalDateTime.parse("2026-01-01T00:00:00"));
        comment.setAnswers(new ArrayList<>());
        return comment;
    }

    private static Answer answer(ContentStatus status) {
        Answer answer = new Answer();
        answer.setId(UUID.randomUUID());
        answer.setContent("Yes");
        answer.setStatus(status);
        answer.setStudent(student());
        answer.setCreatedAt(LocalDateTime.parse("2026-01-01T00:00:00"));
        return answer;
    }
}