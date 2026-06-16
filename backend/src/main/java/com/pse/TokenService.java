package com.pse;


import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

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

    public String createAndSaveAuthToken(String email) {

        String authToken = TokenGenerator.generateToken();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));
        LocalDateTime expiresAt = berlinTime.plusDays(30).toLocalDateTime();


        database.saveAuthToken(email, authToken, expiresAt);


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

        LocalDateTime expiresAt = berlinTime.plusMinutes(999).toLocalDateTime();

        database.saveOTP(email, otp, expiresAt);

        return otp;
    }

    /**
     * Verifies the OTP by checking if it exists, is unused, and isnt expired.
     */
    public boolean verifyOTToken(String email, String token) {

        Integer count = database.validateOTP(email, token);

        if (count == null || count == 0) {
            return false;
        }

        database.consumeOTP(email, token);

        return true;
    }



}