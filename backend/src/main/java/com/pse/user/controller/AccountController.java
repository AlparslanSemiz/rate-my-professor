package com.pse.user.controller;


import com.pse.user.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.user.dto.StudentProfileResponse;


/**
 * Handles all Account related interfaces 
 * (e.g. logout on all devices, validating account credentials...)
 */
@RestController
@RequestMapping("/account")
public class AccountController {


    @Autowired
    private AccountService accountService;

    /**
     * Returns information about the User
     * Used for the HomePage of the App
     *
     * Request:
     *  - auth Token in Header
     */
    @GetMapping("/information")
    public StudentProfileResponse getUserInformation(@RequestHeader("Authorization") String authHeader) {

        return accountService.getUserInformation(authHeader);

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
    @GetMapping("/ratings")
    public UserRatingResponse getUserRatings(@RequestHeader("Authorization") String authHeader) {

        return accountService.getUserRatings(authHeader);

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

        return accountService.requestLogout(authHeader);

    }


    /**
     * Invalidates the Student in the Database by setting flag.
     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PatchMapping("/deleteAccount")
    public BasicResponse deleteAccount(@RequestHeader("Authorization") String authHeader) {

        return accountService.deleteAccount(authHeader);

    }



}