package com.pse.social.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.security.AuthenticatedUser;
import com.pse.social.dto.request.AnswerReportRequest;
import com.pse.social.dto.request.AnswerSubmitRequest;
import com.pse.social.dto.request.CommentReportRequest;
import com.pse.social.dto.request.CommentSubmitRequest;
import com.pse.social.dto.request.VoteAnswerRequest;
import com.pse.social.dto.request.VoteCommentRequest;
import com.pse.social.dto.response.CommentsResponse;
import com.pse.social.dto.response.NotificationsResponse;
import com.pse.social.service.SocialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;


@RestController
@RequestMapping("/social")
public class SocialController {


    private final SocialService socialService;

    public SocialController(SocialService socialService) {
        this.socialService = socialService;
    }



    @GetMapping("/notifications")
    public NotificationsResponse getNotifications(@AuthenticationPrincipal AuthenticatedUser principal){

        return socialService.getNotifications(principal.student());
    }

    @PatchMapping("/notifications/all")
    public BasicResponse markAllNotificationsAsSeen(@AuthenticationPrincipal AuthenticatedUser principal){

        return socialService.markAllNotificationsAsSeen(principal.student());
    }

    @PatchMapping("/notifications")
    public BasicResponse markNotificationAsSeen(@AuthenticationPrincipal AuthenticatedUser principal, @RequestParam UUID notificationId){

        return socialService.markNotificationAsSeen(principal.student(), notificationId);
    }




    @PostMapping("/comments")
    public BasicResponse submitComment(@AuthenticationPrincipal AuthenticatedUser principal, @RequestBody CommentSubmitRequest request) {

        return socialService.submitComment(principal.student(), request);

    }


    @PostMapping("/comments/vote/comment/{comment_id}")
    public BasicResponse voteComment(@PathVariable UUID comment_id, @AuthenticationPrincipal AuthenticatedUser principal, @RequestBody VoteCommentRequest request) {

        return socialService.voteComment(comment_id, principal.student(), request);

    }



    //Returns both Comments *AND* answers
    @GetMapping("/comments/{lecture_id}")
    public CommentsResponse getComments(@PathVariable UUID lecture_id){

        return socialService.getComments(lecture_id);
    }


    @PostMapping("/answers")
    public BasicResponse submitAnswer(@AuthenticationPrincipal AuthenticatedUser principal, @RequestBody AnswerSubmitRequest request) {

        return socialService.submitAnswer(principal.student(), request);

    }

    @PostMapping("/comments/vote/answer{answer_id}")
    public BasicResponse voteAnswer(@PathVariable UUID answer_id, @AuthenticationPrincipal AuthenticatedUser principal, @RequestBody VoteAnswerRequest request) {

        return socialService.voteAnswer(answer_id, principal.student(), request);

    }



    @PostMapping("/comments/report")
    public BasicResponse submitCommentReport(@AuthenticationPrincipal AuthenticatedUser principal, @RequestBody CommentReportRequest request) {

        return socialService.submitCommentReport(principal.student(), request);

    }

    @PostMapping("/answers/report")
    public BasicResponse submitAnswerReport(@AuthenticationPrincipal AuthenticatedUser principal, @RequestBody AnswerReportRequest request) {

        return socialService.submitAnswerReport(principal.student(), request);

    }

    //Returns both Comments *AND* answers
    @GetMapping("/sync/comments")
    public CommentsResponse getComments(){

        return socialService.getAllComments();
    }



}
