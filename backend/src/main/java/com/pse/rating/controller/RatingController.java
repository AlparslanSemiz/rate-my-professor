package com.pse.rating.controller;

import java.util.UUID;

import jakarta.validation.Valid;

import com.pse.rating.dto.response.RatingCategoriesResponse;
import com.pse.rating.dto.response.RatingsAverageResponse;
import com.pse.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.shared.dto.BasicResponse;
import com.pse.rating.dto.request.RatingRequest;
import com.pse.rating.service.RatingService;



@RestController
@RequestMapping("/ratings")
public class RatingController {

    private final RatingService ratingService;


    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping("/rate")
    public BasicResponse submitRating(@AuthenticationPrincipal AuthenticatedUser principal, @Valid @RequestBody RatingRequest request) {
        return ratingService.submitRating(principal.student(), request);
    }

    @GetMapping("/{lectureId}")
    public RatingsAverageResponse getRatings(@PathVariable UUID lectureId) {
        return ratingService.getRatings(lectureId);

    }

    @GetMapping("/{lectureId}/categories")
    public RatingCategoriesResponse getRatingCategories(@PathVariable UUID lectureId) {
        return ratingService.getRatingCategories(lectureId);
    }

    @GetMapping("/own/{lectureId}")
    public RatingsAverageResponse getOwnRating(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable UUID lectureId) {
        return ratingService.getOwnRating(principal.student(), lectureId);
    }




}