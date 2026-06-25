package com.pse.rating.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.TokenService;
import com.pse.rating.dto.request.RatingRequest;
import com.pse.rating.dto.response.TopicAverageResponse;
import com.pse.rating.service.RatingService;
import com.pse.user.model.Student;




@RestController
@RequestMapping("/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;
    @Autowired
    private TokenService tokenService;

    @PostMapping("/rate")
    public BasicResponse submitRating(@RequestHeader("Authorization") String authHeader, @RequestBody  RatingRequest request) {


        Student student = tokenService.verifyUser(authHeader);

        if(student == null) {
            return new BasicResponse("Error, cannot authenticate user", false);
        }


        ratingService.submitRating(student.getKitEmail(), request);

        return new BasicResponse("Rating submitted successfully",true);
    }

    @GetMapping("/{lectureId}")
    public List<TopicAverageResponse> getRatings(@PathVariable UUID lectureId) {
        return ratingService.getRatings(lectureId);
    }

}