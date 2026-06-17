package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.request.RatingRequest;
import com.pse.response.BasicResponse;




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



}