package com.pse.auth.controller;


import com.pse.auth.service.TokenService;
import com.pse.rating.model.Rating;
import com.pse.user.model.Student;
import com.pse.user.dto.StudentProfileResponse;

import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.request.LogoutRequest;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.BasicResponse;

import java.util.List;


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
     * Invalidates all auth-Tokens related to User in Database
     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/information")
    public StudentProfileResponse getUserInformation(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LogoutRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new StudentProfileResponse(
                    "Error, no Auth-Token supplied",
                    false,
                    null, 0, 0, 0, 0);
        }

        if (request.email() == null || request.email().isBlank()) {
            return new StudentProfileResponse(
                    "Error, no email supplied",
                    false,
                    null, 0, 0, 0, 0);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new StudentProfileResponse(
                    "Error, wrong Auth-Token",
                    false,
                    null, 0, 0, 0, 0);
        }

        if (!request.email().equals(email)) {
            return new StudentProfileResponse(
                    "Error, wrong email for auth Token",
                    false,
                    null, 0, 0, 0,0);
        }

        Student student = studentService.findByKitEmail(email).orElse(null);
        double averageRating = studentService.getAverageRating(student);

        List<Rating> ratings = student.getRatings();

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
     * Invalidates all auth-Tokens related to User in Database
     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/ratings")
    public StudentProfileResponse getUserRatings(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody LogoutRequest request) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new StudentProfileResponse(
                    "Error, no Auth-Token supplied",
                    false,
                    null, 0, 0, 0, 0);
        }

        if (request.email() == null || request.email().isBlank()) {
            return new StudentProfileResponse(
                    "Error, no email supplied",
                    false,
                    null, 0, 0, 0, 0);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new StudentProfileResponse(
                    "Error, wrong Auth-Token",
                    false,
                    null, 0, 0, 0, 0);
        }

        if (!request.email().equals(email)) {
            return new StudentProfileResponse(
                    "Error, wrong email for auth Token",
                    false,
                    null, 0, 0, 0,0);
        }

        Student student = studentService.findByKitEmail(email).orElse(null);
        List<Rating> ratings = student.getRatings();


        //TODO: Not implemented yet
        return null;



    }






    /**
     * Invalidates all auth-Tokens related to User in Database
     * 
     * Request: 
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/logout")
    public BasicResponse requestLogout(@RequestHeader("Authorization") String authHeader,
        @RequestBody LogoutRequest request) {


        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Error, no Auth-Token supplied", false);
        }
        if (request.email() == null || request.email().isBlank()) {
            return new BasicResponse("Error, no email supplied", false);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

        if (!request.email().equals(email)) {
            //Shouldnt say "Yo the password doesnt belong to you, it does to another user" :D
            return new BasicResponse("Error, wrong email for auth Token", false);
        }


        //User is validated 

        
        //Iterate through every entry in AuthToken and delete every match where: AuthToken.email == email
        int count = tokenService.invalidateAllAuthTokensForEmail(email);

        return new BasicResponse("Logged out successfully (" + count + " sessions)", true);
    }


    /**
     * Invalidates the Student in the Database by setting flag.
     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/deleteAccount")
    public BasicResponse deleteAccount(@RequestHeader("Authorization") String authHeader,
                                       @RequestBody LogoutRequest request) {


        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Error, no Auth-Token supplied", false);
        }
        if (request.email() == null || request.email().isBlank()) {
            return new BasicResponse("Error, no email supplied", false);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

        if (!request.email().equals(email)) {
            //Shouldnt say "Yo the password doesnt belong to you, it does to another user" :D
            return new BasicResponse("Error, wrong email for auth Token", false);
        }


        //User is validated

        //Set deleted in Database to true
        studentService.softDeleteByKitEmail(email);


        return new BasicResponse("Deleted Account succesfully: " + email, true);
    }

    /**
     * Validates the Users credentials (Email fits Auth-Token)
     * 
     * Request: 
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/validate")
    public BasicResponse validate(@RequestHeader("Authorization") String authHeader,
        @RequestBody ValidateCredsRequest request) {


        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Error, not logged in", false);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

        if (!email.equals(request.email())) {
            return new BasicResponse("Error, wrong email: " + request.email(), false);
        }

        return new BasicResponse("Correct auth-Token for email: " + request.email(), true);

    }


}