package com.pse.auth.controller;

import java.time.LocalDateTime;

import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.service.MailService;
import com.pse.auth.service.TokenService;
import com.pse.shared.util.Utility;
import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.user.model.Student;
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
    private MailService mailService;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private StudentService studentService;
    
    
    /**
     * Creates and saves OTP, and sends it to user's mail
     * 
     * Request:
     * - email
     */
    @PostMapping("/request-login")
    public BasicResponse requestLogin(@RequestBody OTPRequest request) {


        if (request.email() == null || request.email().isBlank()) {
            return new BasicResponse("Error, Email is required", false);
        }

        String userEmail = request.email().trim().toLowerCase();

        if (!userEmail.endsWith("@student.kit.edu")) {
            return new BasicResponse("Email must end with '@student.kit.edu' (was: " + request.email() + ")",false);
        }
          

        String token = tokenService.createAndSaveOTP(userEmail);

        mailService.sendLoginMail(userEmail, token);

        //FOR FUTURE: Don't tell, whether user has an existing account (only e.g. if user has account email has been sent)
        return new BasicResponse("Login Token sent to: " + userEmail, true); 
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

        if (request.email() == null || request.email().isBlank()) {
            return new LoginResponse("Error, Email is required", false, null);
        }
        if (request.loginToken() == null || request.loginToken().isBlank()) {
            return new LoginResponse("Error, login token is required", false, null);
        }


        //Sanitize inputs
        String userEmail = request.email().trim().toLowerCase();
        String otp = request.loginToken().trim();

        boolean valid = tokenService.verifyOTP(userEmail, otp);
        
        if (!valid) {
            //TODO: More fine-grained error message (e.g. token expired...)
            return new LoginResponse("Invalid token", false, null);        
        }
        tokenService.consumeOTP(userEmail, otp);

        //TODO check if Student exists in Databse and if not add him

        Student student = studentService.findByKitEmail(userEmail).orElse(null);


        if(student == null) {
            student = new Student();
            student.setKitEmail(userEmail);

            String userName = Utility.generateUsername();

            student.setUsername(userName);

            student.setEmailVerifiedAt(LocalDateTime.now());
            student.setCredibilityScore(0);

            studentService.addStudent(student);
        }
        

        String authToken = tokenService.createAndSaveAuthToken(student);
        

        //Send successful login mail (Try to get information on ip e.g.)
        String ip = httpRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = httpRequest.getRemoteAddr();
        }
        String userAgent = httpRequest.getHeader("User-Agent");

        mailService.sendSuccessfulLogin(userEmail, ip, userAgent);

        

        return new LoginResponse("Login successful", true, authToken);
    }


    /**
     * Checks whether user is logged in (using only the auth Token)
     */
     @GetMapping("/me")
    public BasicResponse me(@RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Not logged in", false);
        }

        String token = authHeader.substring("Bearer ".length());

        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Not logged in", false);
        }


        return new BasicResponse("Logged in as: " + email, true);
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

        BasicResponse response = tokenService.validateCredentials(authHeader, request.email());

        if (!response.success()) {
            return response;
        }

        return new BasicResponse("Correct auth-Token for email: " + request.email(), true);

    }


}