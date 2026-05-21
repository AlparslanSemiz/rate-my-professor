package com.pse;


import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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

    //Object to communicate to database
    @Autowired
    private JdbcTemplate jdbcTemplate;

    
    /**
     * Creates the token and saves it in the login table.
     */
    public String createAndSaveToken(String email) {

        String token = TokenGenerator.generateToken();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));

        LocalDateTime expiresAt = berlinTime.plusMinutes(5).toLocalDateTime();

        jdbcTemplate.update("""
                INSERT INTO magic_login_tokens(email, token, expires_at, used)
                VALUES (?, ?, ?, false)
                """,
                email,
                token,
                Timestamp.valueOf(expiresAt)
        );

        return token;
    }

    /**
     * Verifies the TOken by checking if it exists, is unused, and isnt expired.
     */
    public boolean verifyToken(String email, String token) {

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM magic_login_tokens
                WHERE email = ?
                  AND token = ?
                  AND used = false
                  AND expires_at > NOW()
                """,
                Integer.class,
                email,
                token
        );

        if (count == null || count == 0) {
            return false;
        }

        jdbcTemplate.update("""
                UPDATE magic_login_tokens
                SET used = true
                WHERE email = ?
                  AND token = ?
                """,
                email,
                token
        );

        return true;
    }


}