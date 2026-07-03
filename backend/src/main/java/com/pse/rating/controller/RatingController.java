package com.pse.rating.controller;

import java.util.UUID;

import com.pse.rating.dto.response.RatingsAverageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.rating.dto.request.RatingRequest;
import com.pse.rating.service.RatingService;




@RestController
@RequestMapping("/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;


    @PostMapping("/rate")
    public BasicResponse submitRating(@RequestHeader("Authorization") String authHeader, @RequestBody  RatingRequest request) {

        return ratingService.submitRating(authHeader, request);

    }

    @GetMapping("/{lectureId}")
    public RatingsAverageResponse getRatings(@PathVariable UUID lectureId) {

        return ratingService.getRatings(lectureId);

    }




}