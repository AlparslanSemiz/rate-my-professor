package com.pse.auth.controller;


import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.service.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;

import jakarta.servlet.http.HttpServletRequest;




/**
 * Handles the authentication of the users.
 * - User can request login (ask for OTP [OneTimePassword])
 * - User can login (with Email and OTP)
 * - User can see if they are logged in (with Bearer Token)
 * 
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    
    /**
     * Creates and saves OTP, and sends it to user's mail
     * 
     * Request:
     * - email
     */
    @PostMapping("/request-login")
    public BasicResponse requestLogin(@RequestBody OTPRequest request) {

        return authService.requestLogin(request);

    }


    /**
     * Server checks whether OTP and Email are valid in database.
     * Addtionally, if succesfully logined, it creates an auth token
     * 
     * Request:
     * - email
     * - otp
     */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {

        return authService.login(request, httpRequest);

    }


    /**
     * Checks whether user is logged in (using only the auth Token)
     */
    @GetMapping("/me")
    public BasicResponse me(@RequestHeader("Authorization") String authHeader) {

         return authService.me(authHeader);

    }


    /**
     * Validates the Users credentials (Email fits Auth-Token)
     *
     * Request:
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/validate")
    public BasicResponse validate(@RequestHeader("Authorization") String authHeader, @RequestBody ValidateCredsRequest request) {

        return authService.validate(authHeader, request);

    }







}