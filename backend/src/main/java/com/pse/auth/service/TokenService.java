package com.pse.auth.service;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.model.OneTimePassword;
import com.pse.auth.model.Token;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


/**
 * Manages the Token/OTP Creation and handling
 *
 */
@Service
public class TokenService {


    @Autowired
    private TokenRepository tokenRepository;
    @Autowired
    private OneTimePasswordRepository oneTimePasswordRepository;

    @Autowired
    private StudentService studentService;




    /**
     * Creates the OTP and saves it in the login table.
     */
    public String createAndSaveOTP(String email) {

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
    public boolean verifyOTP(String email, String otp) {

        return oneTimePasswordRepository.findByEmailAndValueAndUsedFalseAndExpiresAtAfter(
                        email,
                        otp,
                        LocalDateTime.now()
                ).isPresent();

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





    public String createAndSaveAuthToken(Student student) {

        String authToken = TokenGenerator.generateToken();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));
        LocalDateTime expiresAt = berlinTime.plusDays(365).toLocalDateTime();

        String email = studentService.findEmailByStudent(student);

        Token token = new Token();
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



    public int invalidateAllAuthTokensForEmail(String email) {

        List<Token> tokens = tokenRepository.findByEmail(email);

        for (Token token : tokens) {
            token.setRevoked(true);
        }

        return tokens.size();
    
    }


    public Student verifyUser(String authToken) {

        return tokenRepository
                .findByValueAndRevokedFalseAndExpiresAtAfter(
                        authToken,
                        LocalDateTime.now()
                )
                .map(Token::getStudent)
                .orElse(null);
    }



    public BasicResponse validateCredentials(String authHeader, String emailAddress){

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Error, no Auth-Token supplied", false);
        }
        if (emailAddress == null || emailAddress.isBlank()) {
            return new BasicResponse("Error, no email supplied", false);
        }

        String token = authHeader.substring("Bearer ".length());
        String email = verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Error, wrong Auth-Token", false);
        }

        if (!emailAddress.equals(email)) {
            //Shouldnt say "Yo the password doesnt belong to you, it does to another user" :D
            return new BasicResponse("Error, wrong email for auth Token", false);
        }

        return new BasicResponse("Success", true);

    }
    


}