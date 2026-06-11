package com.pse;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.pse.response.ProfessorResponse;


/**
 * To communicate to database in one single class
 * Could be made as an interface
 */
@Service
public class DatabaseService {

    //Object to communicate to database 
    @Autowired
    private JdbcTemplate jdbcTemplate;



    public void saveOTP(String email, String otp, LocalDateTime expiresAt){

        jdbcTemplate.update("""
                INSERT INTO magic_login_tokens(email, token, expires_at, used)
                VALUES (?, ?, ?, false)
                """,
                email,
                otp,
                Timestamp.valueOf(expiresAt)
        );

    }


    public int validateOTP(String email, String otp) {

        return jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM magic_login_tokens
                WHERE email = ?
                  AND token = ?
                  AND used = false
                  AND expires_at > NOW()
                """,
                Integer.class,
                email,
                otp
        );
    }

    /**
     * Set OTP to used in database
     */
    public void consumeOTP(String email, String otp) {

        jdbcTemplate.update("""
                UPDATE magic_login_tokens
                SET used = true
                WHERE email = ?
                  AND token = ?
                """,
                email,
                otp
        );
    }


    public void saveAuthToken(String email, String authToken, LocalDateTime expiresAt){

        jdbcTemplate.update("""
                INSERT INTO auth_tokens(email, token, expires_at, revoked)
                VALUES (?, ?, ?, false)
                """,
                email,
                authToken,
                Timestamp.valueOf(expiresAt)
        );

    }

    /**
     * Validates the auth token, and if valid return the corresponding user Email
     */
    public String verifyAuthToken(String authToken) {
        return jdbcTemplate.query("""
                SELECT email
                FROM auth_tokens
                WHERE token = ?
                  AND revoked = false
                  AND expires_at > NOW()
                """,
                rs -> {
                    if (rs.next()) {
                        return rs.getString("email");
                    }

                    return null;
                },
                authToken
        );
    }






    public int invalidateAllAuthTokensForEmail(String email) {
        return jdbcTemplate.update("""
            UPDATE auth_tokens
            SET revoked = true
            WHERE email = ?
            """,
            email
        );
    }

    
    public List<ProfessorResponse> getProfessors() {

        return jdbcTemplate.query("""
                SELECT
                    id,
                    first_name,
                    last_name,
                    photo_url,
                    average_rating,
                    rating_count
                FROM professors
                WHERE is_active = true
                ORDER BY last_name, first_name
                """,
                (rs, rowNum) -> {
            return new ProfessorResponse(
                    rs.getString("id"),
                    rs.getString("first_name"),
                    rs.getString("last_name"),
                    rs.getString("photo_url"),
                    rs.getDouble("average_rating"),
                    rs.getInt("rating_count")
            );
        }
        );
    }

}