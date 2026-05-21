package com.pse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;



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
    public String requestLogin(@RequestBody LoginRequest request, HttpSession session) {


        //TODO check if email ends with "@student.kit.edu"
            //For now not important, since via @icloud emails are presumably faster 

        String token = tokenService.createAndSaveToken(request.email());

        //Could store Token ins session here 
       
        mailService.sendLoginMail(request.email(), token);

        //FOR FUTURE: Dont tell, whether user has an existing account (only e.g. if user has account email has been sent)
        return "Login Token sent to: " + request.email(); 
    
    }

    /**
     * Server checks whether token and email are valid in database
     */
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request, HttpSession session) {

    boolean valid = tokenService.verifyToken(request.email(), request.token());

        if (!valid) {
            //TODO: More fine-grained error message (e.g. token expired...)
            return "Invalid token";
        }

        session.setAttribute("email", request.email());
        session.setAttribute("authenticated", true);

        return "Logged in with " + request.email() + " and Token: " + request.token();
    }


    /**
     * Checks whether user is logged in (using only the session)
     */
    @GetMapping("/me")
    public String me(HttpSession session) {

        boolean authenticated = (boolean) session.getAttribute("authenticated");

        if (!authenticated || authenticated == null) {
            return "Not logged in";
        }

        return "Logged in as: " + session.getAttribute("email");;
    }

    public record LoginRequest(String email, String token) {}
}