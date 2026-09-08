package com.pse.social;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.security.AuthenticatedUser;
import com.pse.social.controller.SocialController;
import com.pse.social.dto.request.*;
import com.pse.social.dto.response.CommentsResponse;
import com.pse.social.dto.response.NotificationsResponse;
import com.pse.social.service.SocialService;
import com.pse.user.model.Student;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialControllerTests {

    @Mock
    private SocialService socialService;

    @Mock
    private AuthenticatedUser principal;

    @Mock
    private Student student;

    @InjectMocks
    private SocialController socialController;


    @Test
    void getNotificationsReturnsServiceResponse() {

        NotificationsResponse expected =
                mock(NotificationsResponse.class);

        when(principal.student()).thenReturn(student);
        when(socialService.getNotifications(student))
                .thenReturn(expected);


        NotificationsResponse response = socialController.getNotifications(principal);


        assertThat(response).isSameAs(expected);
        verify(socialService).getNotifications(student);
    }


    @Test
    void markNotificationAsSeenReturnsServiceResponse() {

        UUID notificationId = UUID.randomUUID();

        BasicResponse expected =
                new BasicResponse("seen", true);

        when(principal.student()).thenReturn(student);

        when(socialService.markNotificationAsSeen(
                student,
                notificationId
        )).thenReturn(expected);


        BasicResponse response = socialController.markNotificationAsSeen(principal, notificationId);

        assertThat(response).isSameAs(expected);

        verify(socialService)
                .markNotificationAsSeen(
                        student,
                        notificationId
                );
    }


    @Test
    void submitCommentReturnsServiceResponse() {

        CommentSubmitRequest request =
                mock(CommentSubmitRequest.class);

        BasicResponse expected =
                new BasicResponse("success", true);

        when(principal.student()).thenReturn(student);

        when(socialService.submitComment(student, request))
                .thenReturn(expected);


        BasicResponse response = socialController.submitComment(principal, request);


        assertThat(response).isSameAs(expected);

        verify(socialService)
                .submitComment(student, request);
    }


    @Test
    void voteCommentReturnsServiceResponse() {

        UUID commentId = UUID.randomUUID();

        VoteCommentRequest request =
                mock(VoteCommentRequest.class);

        BasicResponse expected = new BasicResponse("success", true);

        when(principal.student()).thenReturn(student);

        when(socialService.voteComment(
                commentId,
                student,
                request
        )).thenReturn(expected);


        BasicResponse response =
                socialController.voteComment(
                        commentId,
                        principal,
                        request
                );


        assertThat(response).isSameAs(expected);

        verify(socialService)
                .voteComment(
                        commentId,
                        student,
                        request
                );
    }


    @Test
    void getCommentsReturnsServiceResponse() {

        UUID lectureId = UUID.randomUUID();

        CommentsResponse expected =
                mock(CommentsResponse.class);

        when(socialService.getComments(lectureId, null))
                .thenReturn(expected);


        CommentsResponse response = socialController.getComments(null, lectureId);


        assertThat(response).isSameAs(expected);

        verify(socialService).getComments(lectureId, null);
    }


    @Test
    void submitAnswerReturnsServiceResponse() {

        AnswerSubmitRequest request =
                mock(AnswerSubmitRequest.class);

        BasicResponse expected =
                new BasicResponse("success", true);

        when(principal.student()).thenReturn(student);

        when(socialService.submitAnswer(student, request))
                .thenReturn(expected);


        BasicResponse response =
                socialController.submitAnswer(
                        principal,
                        request
                );


        assertThat(response).isSameAs(expected);

        verify(socialService)
                .submitAnswer(student, request);
    }


    @Test
    void voteAnswerReturnsServiceResponse() {

        UUID answerId = UUID.randomUUID();

        VoteAnswerRequest request =
                mock(VoteAnswerRequest.class);

        BasicResponse expected =
                new BasicResponse("success", true);

        when(principal.student()).thenReturn(student);

        when(socialService.voteAnswer(
                answerId,
                student,
                request
        )).thenReturn(expected);


        BasicResponse response =
                socialController.voteAnswer(
                        answerId,
                        principal,
                        request
                );


        assertThat(response).isSameAs(expected);

        verify(socialService)
                .voteAnswer(
                        answerId,
                        student,
                        request
                );
    }


    @Test
    void submitCommentReportReturnsServiceResponse() {

        CommentReportRequest request = mock(CommentReportRequest.class);

        BasicResponse expected = new BasicResponse("success", true);

        when(principal.student()).thenReturn(student);

        when(socialService.submitCommentReport(
                student,
                request
        )).thenReturn(expected);


        BasicResponse response =
                socialController.submitCommentReport(
                        principal,
                        request
                );


        assertThat(response).isSameAs(expected);

        verify(socialService)
                .submitCommentReport(
                        student,
                        request
                );
    }


    @Test
    void submitAnswerReportReturnsServiceResponse() {

        AnswerReportRequest request = mock(AnswerReportRequest.class);

        BasicResponse expected = new BasicResponse("success", true);

        when(principal.student()).thenReturn(student);

        when(socialService.submitAnswerReport(
                student,
                request
        )).thenReturn(expected);


        BasicResponse response =
                socialController.submitAnswerReport(
                        principal,
                        request
                );


        assertThat(response).isSameAs(expected);

        verify(socialService)
                .submitAnswerReport(
                        student,
                        request
                );
    }


    @Test
    void getAllCommentsReturnsServiceResponse() {

        CommentsResponse expected = mock(CommentsResponse.class);

        when(socialService.getAllComments())
                .thenReturn(expected);


        CommentsResponse response = socialController.getComments();


        assertThat(response).isSameAs(expected);

        verify(socialService).getAllComments();
    }
}