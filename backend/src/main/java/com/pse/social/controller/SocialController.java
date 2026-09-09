package com.pse.social.controller;

import com.pse.shared.dto.BasicResponse;
import com.pse.security.AuthenticatedUser;
import com.pse.social.dto.request.AnswerReportRequest;
import com.pse.social.dto.request.AnswerSubmitRequest;
import com.pse.social.dto.request.CommentReportRequest;
import com.pse.social.dto.request.CommentSubmitRequest;
import com.pse.social.dto.request.VoteAnswerRequest;
import com.pse.social.dto.request.VoteCommentRequest;
import com.pse.social.dto.response.CommentsResponse;
import com.pse.social.dto.response.NotificationsResponse;
import com.pse.social.service.AnswerService;
import com.pse.social.service.CommentService;
import com.pse.social.service.ContentReportService;
import com.pse.social.service.NotificationService;
import com.pse.social.service.VoteService;
import com.pse.user.model.Student;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * JavaDoc1
 */
@RestController
@RequestMapping("/social")
public class SocialController {


    private final CommentService commentService;
    private final AnswerService answerService;
    private final VoteService voteService;
    private final ContentReportService contentReportService;
    private final NotificationService notificationService;

    public SocialController(
            CommentService commentService,
            AnswerService answerService,
            VoteService voteService,
            ContentReportService contentReportService,
            NotificationService notificationService
    ) {
        this.commentService = commentService;
        this.answerService = answerService;
        this.voteService = voteService;
        this.contentReportService = contentReportService;
        this.notificationService = notificationService;
    }



    @GetMapping("/notifications")
    public NotificationsResponse getNotifications(@AuthenticationPrincipal AuthenticatedUser principal){

        return notificationService.getNotifications(principal.student());
    }

    @PatchMapping("/notifications/{notification_id}")
    public BasicResponse markNotificationAsSeen(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable UUID notification_id){

        return notificationService.markNotificationAsSeen(principal.student(), notification_id);
    }




    @PostMapping("/comments")
    public BasicResponse submitComment(@AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody CommentSubmitRequest request) {

        return commentService.submitComment(principal.student(), request);

    }


    @PostMapping("/comments/vote/comment/{comment_id}")
    public BasicResponse voteComment(@PathVariable UUID comment_id, @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody VoteCommentRequest request) {

        return voteService.voteComment(comment_id, principal.student(), request);

    }


    //Returns both Comments *AND* answers
    @GetMapping("/comments/{lecture_id}")
    public CommentsResponse getComments(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable UUID lecture_id){

        Student student = principal != null ? principal.student() : null;

        return commentService.getComments(lecture_id, student);
    }


    @PostMapping("/answers")
    public BasicResponse submitAnswer(@AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody AnswerSubmitRequest request) {

        return answerService.submitAnswer(principal.student(), request);

    }

    @PostMapping("/comments/vote/answer/{answer_id}")
    public BasicResponse voteAnswer(@PathVariable UUID answer_id, @AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody VoteAnswerRequest request) {

        return voteService.voteAnswer(answer_id, principal.student(), request);

    }



    @PostMapping("/comments/report")
    public BasicResponse submitCommentReport(@AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody CommentReportRequest request) {

        return contentReportService.submitCommentReport(principal.student(), request);

    }

    @PostMapping("/answers/report")
    public BasicResponse submitAnswerReport(@AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody AnswerReportRequest request) {

        return contentReportService.submitAnswerReport(principal.student(), request);

    }

    //Returns both Comments *AND* answers
    @GetMapping("/sync/comments")
    public CommentsResponse getComments(){

        return commentService.getAllComments();
    }



}
