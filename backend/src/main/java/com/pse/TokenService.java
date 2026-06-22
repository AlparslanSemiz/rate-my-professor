package com.pse;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import com.pse.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


/**
 * Handles the communication to the login database.
 * Inserts newly created Tokens in table (INSERT INTO)
 * Verifies Token (SELECT)
 * Updates used flag (UPDATE)
 * 
 * CONCERNS:
 * - Is SQL Injection here possible?
 * - NOW() Time may be out of sync, Summer and Winter Time 
 */
@Service
public class TokenService {

    @Autowired
    private DatabaseService database;



    public int invalidateAllAuthTokensForEmail(String email) {

        return database.invalidateAllAuthTokensForEmail(email);
    
    }

    public String createAndSaveAuthToken(Student student) {

        String authToken = TokenGenerator.generateToken();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));
        LocalDateTime expiresAt = berlinTime.plusDays(30).toLocalDateTime();


        database.saveAuthToken(student, authToken, expiresAt);


        return authToken;
    }
    
    public String verifyAuthToken(String authToken) {

        return database.verifyAuthToken(authToken);
    }



    /**
     * Creates the OTP and saves it in the login table.
     */
    public String createAndSaveOTToken(String email) {

        String otp = TokenGenerator.generateOneTimePassword();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));

        LocalDateTime expiresAt = berlinTime.plusMinutes(5).toLocalDateTime();

        database.saveOTP(email, otp, expiresAt);

        return otp;
    }

    /**
     * Verifies the OTP by checking if it exists, is unused, and isnt expired.
     */
    public boolean verifyOTToken(String email, String token) {

        return database.validateOTP(email, token);
    }

    /**
     * Verifies the OTP by checking if it exists, is unused, and isnt expired.
     */
    public void consumeOTP(String email, String token) {

        database.consumeOTP(email, token);
    }
    


}