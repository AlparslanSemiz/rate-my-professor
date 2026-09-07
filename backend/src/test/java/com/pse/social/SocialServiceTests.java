package com.pse.social;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.response.BasicResponse;
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
import com.pse.user.model.Student;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
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
    void submitCommentReturnsErrorWhenLectureDoesNotExist() {

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


        BasicResponse response =
                socialService.submitComment(
                        student,
                        request
                );


        assertFalse(response.success());

        assertEquals(
                "Error, cannot submit comment",
                response.message()
        );

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


        assertTrue(response.success());

        assertEquals(
                "Comment submitted successfully",
                response.message()
        );


        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);

        verify(commentRepository).save(captor.capture());

        Comment saved = captor.getValue();

        assertSame(student, saved.getStudent());
        assertSame(lecture, saved.getLecture());
        assertEquals(
                "Great lecture",
                saved.getContent()
        );


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
    void voteCommentReturnsErrorWhenCommentDoesNotExist() {

        UUID commentId = UUID.randomUUID();

        Student student = mock(Student.class);

        VoteCommentRequest request = mock(VoteCommentRequest.class);

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.empty());


        BasicResponse response =
                socialService.voteComment(
                        commentId,
                        student,
                        request
                );


        assertFalse(response.success());

        assertEquals(
                "Error, cannot find comment",
                response.message()
        );

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


        BasicResponse response =
                socialService.voteComment(
                        commentId,
                        student,
                        request
                );


        assertTrue(response.success());


        ArgumentCaptor<CommentVote> captor =
                ArgumentCaptor.forClass(
                        CommentVote.class
                );

        verify(commentVoteRepository).save(captor.capture());


        CommentVote vote = captor.getValue();

        assertSame(student, vote.getStudent());
        assertSame(comment, vote.getComment());
        assertEquals(
                VoteType.UP,
                vote.getVote()
        );
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


        BasicResponse response =
                socialService.voteComment(
                        commentId,
                        student,
                        request
                );


        assertTrue(response.success());

        verify(existingVote).setVote(VoteType.DOWN);

        verify(commentVoteRepository).save(existingVote);
    }



    @Test
    void submitAnswerReturnsErrorWhenCommentDoesNotExist() {

        Student student = mock(Student.class);

        AnswerSubmitRequest request = mock(AnswerSubmitRequest.class);

        UUID commentId = UUID.randomUUID();

        when(request.commentID())
                .thenReturn(commentId.toString());

        when(request.content())
                .thenReturn("My answer");

        when(commentRepository.findById(commentId))
                .thenReturn(Optional.empty());


        BasicResponse response =
                socialService.submitAnswer(
                        student,
                        request
                );


        assertFalse(response.success());

        assertEquals(
                "Error, couldn't find comment",
                response.message()
        );

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


        assertTrue(response.success());

        assertEquals(
                "Answer submitted successfully",
                response.message()
        );


        ArgumentCaptor<Answer> answerCaptor =
                ArgumentCaptor.forClass(Answer.class);

        verify(answerRepository)
                .save(answerCaptor.capture());

        Answer answer =
                answerCaptor.getValue();

        assertSame(
                answerAuthor,
                answer.getStudent()
        );

        assertSame(
                comment,
                answer.getComment()
        );

        assertEquals(
                "Helpful answer",
                answer.getContent()
        );


        ArgumentCaptor<Notification> notificationCaptor =
                ArgumentCaptor.forClass(
                        Notification.class
                );

        verify(notificationRepository)
                .save(notificationCaptor.capture());


        Notification notification =
                notificationCaptor.getValue();

        assertSame(
                commentAuthor,
                notification.getRecipient()
        );

        assertSame(
                lecture,
                notification.getLecture()
        );

        assertSame(
                comment,
                notification.getOwnComment()
        );

        assertSame(
                answer,
                notification.getAnswer()
        );

        assertEquals(
                NotificationType.ANSWER,
                notification.getType()
        );


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
    void voteAnswerReturnsErrorWhenAnswerDoesNotExist() {

        UUID answerId = UUID.randomUUID();

        Student student = mock(Student.class);

        VoteAnswerRequest request = mock(VoteAnswerRequest.class);

        when(answerRepository.findById(answerId))
                .thenReturn(Optional.empty());


        BasicResponse response =
                socialService.voteAnswer(
                        answerId,
                        student,
                        request
                );


        assertFalse(response.success());

        assertEquals(
                "Error, cannot find Answer",
                response.message()
        );

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


        BasicResponse response =
                socialService.voteAnswer(
                        answerId,
                        student,
                        request
                );


        assertTrue(response.success());

        verify(existingVote).setVote(VoteType.DOWN);

        verify(answerVoteRepository).save(existingVote);
    }


    @Test
    void submitCommentReportReturnsErrorWhenCommentDoesNotExist() {

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


        BasicResponse response =
                socialService.submitCommentReport(
                        student,
                        request
                );


        assertFalse(response.success());

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


        assertTrue(response.success());


        ArgumentCaptor<CommentReport> captor =
                ArgumentCaptor.forClass(
                        CommentReport.class
                );

        verify(commentReportRepository).save(captor.capture());


        CommentReport report =
                captor.getValue();

        assertSame(reporter, report.getReporter());
        assertSame(comment, report.getComment());

        assertEquals(
                ReportReason.HARASSMENT,
                report.getReason()
        );

        assertEquals(
                "Rude",
                report.getExplanation()
        );


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
    void submitAnswerReportReturnsErrorWhenAnswerDoesNotExist() {

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


        BasicResponse response =
                socialService.submitAnswerReport(
                        student,
                        request
                );


        assertFalse(response.success());

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


        assertTrue(response.success());

        assertEquals(
                "Found: 1 Notifications",
                response.message()
        );

        assertEquals(
                1,
                response.notifications().size()
        );

        assertEquals(
                NotificationType.WARNING,
                response.notifications()
                        .get(0)
                        .type()
        );

        assertEquals(
                "Please behave",
                response.notifications()
                        .get(0)
                        .message()
        );
    }


    @Test
    void markNotificationAsSeenReturnsErrorWhenNotificationDoesNotBelongToStudent() {

        Student student = mock(Student.class);

        UUID notificationId = UUID.randomUUID();

        when(notificationRepository
                .findByRecipientAndId(
                        student,
                        notificationId
                ))
                .thenReturn(Optional.empty());


        BasicResponse response =
                socialService.markNotificationAsSeen(
                        student,
                        notificationId
                );


        assertFalse(response.success());

        assertEquals(
                "Notification Not Found",
                response.message()
        );
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


        assertTrue(response.success());

        assertEquals(
                "Marked Notifications as seen",
                response.message()
        );

        verify(notification).setSeen(true);
    }
}