package com.pse.moderation.controller;


import com.pse.auth.service.TokenService;
import com.pse.moderation.service.ModerationService;
import com.pse.rating.dto.response.TopicAverageResponse;
import com.pse.moderation.dto.response.UserListResponse;

import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class ModerationController {


    @Autowired
    private ModerationService moderationService;
    @Autowired
    private TokenService tokenService;


    @GetMapping
    public UserListResponse getUsers(@RequestHeader("Authorization") String authHeader) {

        Student student = tokenService.verifyUser(authHeader);
        if(student == null) {
            return null;
        }

        if(!moderationService.verifyAdmin(student)){
            return null;
        }

        //Is Admin




        return moderationService.getAllUsers();
    }


    @GetMapping("/{student_id}")
    public List<TopicAverageResponse> getRatings(@PathVariable UUID student_id) {

        return null;

    }


}
