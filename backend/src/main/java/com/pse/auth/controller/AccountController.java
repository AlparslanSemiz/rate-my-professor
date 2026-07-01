package com.pse.auth.controller;


import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.request.LogoutRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingDto;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.auth.service.TokenService;
import com.pse.rating.model.Rating;
import com.pse.rating.model.RatingTopic;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;


/**
 * Handles all Account related interfaces 
 * (e.g. logout on all devices, validating account credentials...)
 */
@RestController
@RequestMapping("/account")
public class AccountController {

    @Autowired
    private TokenService tokenService;
    @Autowired
    private StudentService studentService;


    /**
     * Returns information about the User
     * Used for the HomePage of the App
     *
     * Request:
     *  - auth Token in Header
     */
    @PostMapping("/information")
    public StudentProfileResponse getUserInformation(
            @RequestHeader("Authorization") String authHeader) {

        Student student = tokenService.verifyUser(authHeader);

        if (student == null) {
            return new StudentProfileResponse(
                    "Error, cannot authenticate user",
                    false,
                    null,
                    0,
                    0,
                    0,
                    0
            );
        }

        double averageRating = studentService.getAverageRating(student);

        return new StudentProfileResponse(
                "Success",
                true,
                student.getUsername(),
                averageRating,
                student.getRatings().size(),
                student.getComments().size(),
                student.getCredibilityScore()
                );

    }

    /**
     * Returns all the Ratings of the User
     * Used for the Homepage of the App
     *
     *
     *
     //Was wir zurückgeben wollen

     //Rating #1:
     //Lineare Algebra 1, Kühnlein (SS24)
     //Bewertung Overall: 9/10

     //Rating #1:
     //TGI, Müller Quade (SS25)
     //Bewertung Overall: 8/10

     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/ratings")
    public UserRatingResponse getUserRatings(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LogoutRequest request) {


        Student student = tokenService.verifyUser(authHeader);
        if (student == null) {
            return new UserRatingResponse(
                    "Error, cannot authenticate user",
                    false,
                    null
            );
        }

        List<UserRatingDto> ratingDtos = new ArrayList<>();


        for (Rating rating : student.getRatings()) {

            String lectureName = rating.getLecture().getName();

            String professorName =
                    rating.getLecture().getProfessor().getLastName();

            String semester = rating.getLecture().getSemesterSeason().toString()
                    + rating.getLecture().getSemesterYear();

            int overallRating = 0;

            for (RatingTopic topic : rating.getTopics()) {
                if (topic.getName().equals("overall")) {
                    overallRating = topic.getValue();
                    break;
                }
            }

            ratingDtos.add(new UserRatingDto(
                    lectureName,
                    professorName,
                    semester,
                    overallRating
            ));
        }

        return new UserRatingResponse(
                        "Success",
                        true,
                        ratingDtos
        );

    }



    /**
     * Invalidates all auth-Tokens related to User in Database
     * 
     * Request: 
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/logout")
    public BasicResponse requestLogout(@RequestHeader("Authorization") String authHeader) {

        Student student = tokenService.verifyUser(authHeader);

        if (student == null) {
            return new BasicResponse("Error, couldnt authenticate user", false);
        }


        //Iterate through every entry in AuthToken and delete every match where: AuthToken.email == email
        int sessions = tokenService.invalidateAllAuthTokensForEmail(student.getKitEmail());

        return new BasicResponse("Logged out successfully (" + sessions + " sessions)", true);
    }


    /**
     * Invalidates the Student in the Database by setting flag.
     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/deleteAccount")
    public BasicResponse deleteAccount(@RequestHeader("Authorization") String authHeader) {


        Student student = tokenService.verifyUser(authHeader);

        if (student == null) {
            return new BasicResponse("Error, couldnt authenticate user", false);
        }

        //Set deleted in Database: Set "deleted" to true
        if( !(studentService.softDeleteByKitEmail(student.getKitEmail()))){
           return new BasicResponse("Error, couldnt find student", false);     
        }
        
        return new BasicResponse("Deleted Account succesfully: " + student.getKitEmail(), true);
    }



}