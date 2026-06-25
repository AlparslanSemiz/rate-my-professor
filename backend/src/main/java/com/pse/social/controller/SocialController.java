package com.pse.social.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.TokenService;
import com.pse.social.dto.request.AnswerSubmitRequest;
import com.pse.social.dto.request.CommentSubmitRequest;
import com.pse.social.service.SocialService;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/social")
public class SocialController {


    @Autowired
    private SocialService socialService;
    @Autowired
    private TokenService tokenService;

    @PostMapping("/submitComment")
    public BasicResponse submitComment(@RequestHeader("Authorization") String authHeader, @RequestBody CommentSubmitRequest request) {


        Student student = tokenService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }

        if(!socialService.submitComment(student, request.lectureID(), request.content())){
            return new BasicResponse("Error, cannot submit comment", false);
        }


        return new BasicResponse("Rating submitted successfully",true);
    }

    @PostMapping("/submitAnswer")
    public BasicResponse submitAnswer(@RequestHeader("Authorization") String authHeader, @RequestBody AnswerSubmitRequest request) {


        Student student = tokenService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }



        if(!socialService.submitAnswer(student, request.commentID(), request.content())){
            return new BasicResponse("Error, couldnt finde comment",false);
        }


        return new BasicResponse("Answer submitted successfully",true);
    }


}
