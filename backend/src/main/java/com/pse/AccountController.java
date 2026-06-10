package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.request.LogoutRequest;
import com.pse.request.ValidateCredsRequest;
import com.pse.response.BasicResponse;




@RestController
@RequestMapping("/account")
public class AccountController {

    @Autowired
    private TokenService tokenService;

    
    /**
     * Invalidates all auth-Tokens in Users Database
     * 
     * Request: 
     *  - email
     *  - (auth Token in Header)
     */
    @PostMapping("/logout")
    public BasicResponse requestLogout(@RequestHeader("Authorization") String authHeader,
        @RequestBody LogoutRequest request) {


        //Check if user is user logged in
            //check if User has entered correct email



        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Error, not logged in", false);
        }

        String token = authHeader.substring("Bearer ".length());

    
        String email = tokenService.verifyAuthToken(token);
        if (email == null) {
            //User has wrong Auth Token
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

        if (request.email() == null) {
            return new BasicResponse("Error, no email found", false);
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
     * Validates the User
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
            //User has wrong Auth Token
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

    
        if (email.equals(request.email())) {
            return new BasicResponse("Correct auth-Token for email: " + request.email(), true);
        }
    
        return new BasicResponse("Error, wrong email: " + request.email(), false);
    
    }


}