package com.pse.rating.controller;

import java.util.List;
import java.util.UUID;

import com.pse.rating.service.RatingService;
import com.pse.auth.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.rating.dto.request.RatingRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.rating.dto.response.TopicAverageResponse;




@RestController
@RequestMapping("/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;
    @Autowired
    private TokenService tokenService;

    @PostMapping
    public BasicResponse submitRating(@RequestHeader("Authorization") String authHeader, @RequestBody  RatingRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Error, not logged in", false);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

        //User is logged in 

        ratingService.submitRating(email, request);

        return new BasicResponse("Rating submitted successfully",true);
    }

    @GetMapping("/{lectureId}")
    public List<TopicAverageResponse> getRatings(@PathVariable UUID lectureId) {
        return ratingService.getRatings(lectureId);
    }

}