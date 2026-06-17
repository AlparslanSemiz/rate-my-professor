package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.request.LoginRequest;
import com.pse.request.OTPRequest;
import com.pse.response.BasicResponse;
import com.pse.response.LoginResponse;

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
          

        String token = tokenService.createAndSaveOTToken(userEmail);

        mailService.sendLoginMail(userEmail, token);

        //FOR FUTURE: Dont tell, whether user has an existing account (only e.g. if user has account email has been sent)
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

        boolean valid = tokenService.verifyOTToken(userEmail, otp);
        
        if (!valid) {
            //TODO: More fine-grained error message (e.g. token expired...)
            return new LoginResponse("Invalid token", false, null);        
        }
        tokenService.consumeOTP(userEmail, otp);

        String authToken = tokenService.createAndSaveAuthToken(userEmail);
        

        //Send successful login mail (Try to get ifnormation on ip e.g.)
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


}