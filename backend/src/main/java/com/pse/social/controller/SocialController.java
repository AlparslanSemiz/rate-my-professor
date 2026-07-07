package com.pse.social.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.social.dto.request.AnswerReportRequest;
import com.pse.social.dto.request.AnswerSubmitRequest;
import com.pse.social.dto.request.CommentReportRequest;
import com.pse.social.dto.request.CommentSubmitRequest;
import com.pse.social.dto.response.CommentsResponse;
import com.pse.social.service.SocialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;


@RestController
@RequestMapping("/social")
public class SocialController {


    @Autowired
    private SocialService socialService;



    @PostMapping("/comments")
    public BasicResponse submitComment(@RequestHeader("Authorization") String authHeader, @RequestBody CommentSubmitRequest request) {

        return socialService.submitComment(authHeader, request);



    }


    //Returns both Comments *AND* answers
    @GetMapping("/comments/{lecture_id}")
    public CommentsResponse getComments(@PathVariable UUID lecture_id){

        return socialService.getComments(lecture_id);
    }


    @PostMapping("/answers")
    public BasicResponse submitAnswer(@RequestHeader("Authorization") String authHeader, @RequestBody AnswerSubmitRequest request) {

        return socialService.submitAnswer(authHeader, request);

    }







    @PostMapping("/comments/report")
    public BasicResponse submitCommentReport(@RequestHeader("Authorization") String authHeader, @RequestBody CommentReportRequest request) {

        return socialService.submitCommentReport(authHeader, request);

    }

    @PostMapping("/answers/report")
    public BasicResponse submitAnswerReport(@RequestHeader("Authorization") String authHeader, @RequestBody AnswerReportRequest request) {

        return socialService.submitAnswerReport(authHeader, request);

    }







}
