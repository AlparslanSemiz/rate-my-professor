package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;





/**
 * Handles the authentication of the users.
 * User can request login (ask for Token)
 * User can login (with Email and Token)
 * User can see if they are logged in (with HTTP Session)
 * 
 * 
 * CONCERNS:
 * - NOT Secure, token AND JSESSION are transported unencrypted 
 */
@RestController
@RequestMapping("/auth")
public class AuthController {


    @Autowired
    private MailService mailService;
    @Autowired
    private TokenService tokenService;
    
    

    /**
     * Creates and saves token, and sends it to users mail
     */
    @PostMapping("/request-login")
    public JSONResponse requestLogin(@RequestBody LoginRequest request) {


        
        if (!request.email().toLowerCase().endsWith("@student.kit.edu")) {
            return new JSONResponse("Email must end with '@student.kit.edu' (was: " + request.email() + ")",false);
        }
          

        String token = tokenService.createAndSaveOTToken(request.email());

        mailService.sendLoginMail(request.email(), token);

        //FOR FUTURE: Dont tell, whether user has an existing account (only e.g. if user has account email has been sent)
        return new JSONResponse("Login Token sent to: " + request.email(), true); 
    
    }

    /**
     * Server checks whether token and email are valid in database.
     * Addtionally, if succesfully logined, it creates an auth token
     */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {

    boolean valid = tokenService.verifyOTToken(request.email(), request.loginToken());

        if (!valid) {
            //TODO: More fine-grained error message (e.g. token expired...)
            return new LoginResponse("Invalid token", false, null);        
        }

        String authToken = tokenService.createAndSaveAuthToken(request.email());
        

        return new LoginResponse("Login successful", true, authToken);
    }


    /**
     * Checks whether user is logged in (using only the session)
     */
     @GetMapping("/me")
    public JSONResponse me(@RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new JSONResponse("Not logged in", false);
        }

        String token = authHeader.substring("Bearer ".length());

        String email = tokenService.verifyAuthToken(token);

        if (email == null) {
            return new JSONResponse("Not logged in", false);
        }

        return new JSONResponse("Logged in as: " + email, true);
    }

    public record LoginRequest(String email, String loginToken) {}

    public record LoginResponse(String message, boolean success, String authToken) {}


}