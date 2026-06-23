package com.pse.auth.service;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;


import com.pse.auth.model.OneTimePassword;
import com.pse.auth.model.Token;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;
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
    private TokenRepository tokenRepository;
    @Autowired
    private OneTimePasswordRepository oneTimePasswordRepository;


    @Autowired
    private StudentService studentService;




    public int invalidateAllAuthTokensForEmail(String email) {

        List<Token> tokens = tokenRepository.findByEmail(email);

        for (Token token : tokens) {
            token.setRevoked(true);
        }

        return tokens.size();
    
    }

    public String createAndSaveAuthToken(Student student) {

        String authToken = TokenGenerator.generateToken();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));
        LocalDateTime expiresAt = berlinTime.plusDays(30).toLocalDateTime();




        Token token = new Token();

        String email = studentService.findEmailByStudent(student);

        token.setEmail(email);
        token.setValue(authToken);
        token.setExpiresAt(expiresAt);
        token.setStudent(student);

        tokenRepository.save(token);

        return authToken;
    }
    
    public String verifyAuthToken(String authToken) {

        return tokenRepository
                .findByValueAndRevokedFalseAndExpiresAtAfter(
                        authToken,
                        LocalDateTime.now()
                )
                .map(Token::getEmail)
                .orElse(null);
    }



    /**
     * Creates the OTP and saves it in the login table.
     */
    public String createAndSaveOTToken(String email) {

        String otp = TokenGenerator.generateOneTimePassword();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));

        LocalDateTime expiresAt = berlinTime.plusMinutes(5).toLocalDateTime();


        OneTimePassword oneTimePassword = new OneTimePassword();

        oneTimePassword.setEmail(email);
        oneTimePassword.setValue(otp);
        oneTimePassword.setExpiresAt(expiresAt);

        oneTimePasswordRepository.save(oneTimePassword);


        return otp;
    }

    /**
     * Verifies the OTP by checking if it exists, is unused, and isnt expired.
     */
    public boolean verifyOTToken(String email, String otp) {

        return oneTimePasswordRepository.findByEmailAndValueAndUsedFalseAndExpiresAtAfter(
                        email,
                        otp,
                        LocalDateTime.now()
                )
                .isPresent();

    }

    /**
     * Verifies the OTP by checking if it exists, is unused, and isnt expired.
     */
    public void consumeOTP(String email, String otp) {


        oneTimePasswordRepository
                .findByEmailAndValueAndUsedFalseAndExpiresAtAfter(
                        email,
                        otp,
                        LocalDateTime.now()
                )
                .ifPresent(oneTimePassword -> {
                    oneTimePassword.setUsed(true);
                    oneTimePasswordRepository.save(oneTimePassword);
                });

    }
    


}