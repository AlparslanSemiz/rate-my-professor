package com.pse.auth.service;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;


import com.pse.auth.dto.request.LoginRequest;
import com.pse.auth.dto.request.OTPRequest;
import com.pse.auth.dto.request.ValidateCredsRequest;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.LoginResponse;
import com.pse.auth.model.OneTimePassword;
import com.pse.auth.model.Token;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.shared.util.HashGenerator;
import com.pse.shared.util.NameGenerator;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


/**
 * Manages the Token/OTP Creation and handling
 *
 */
@Service
public class AuthService {

    private final StudentService studentService;


    private final MailService mailService;
    private final TokenRepository tokenRepository;
    private final OneTimePasswordRepository oneTimePasswordRepository;



    public AuthService(StudentService studentService, MailService mailService, TokenRepository tokenRepository, OneTimePasswordRepository oneTimePasswordRepository) {

        this.studentService = studentService;
        this.mailService = mailService;
        this.tokenRepository = tokenRepository;
        this.oneTimePasswordRepository = oneTimePasswordRepository;

    }


    public BasicResponse requestLogin(OTPRequest request) {

        if (request.email() == null || request.email().isBlank()) {
            return new BasicResponse("Error, Email is required", false);
        }

        String userEmail = request.email().trim().toLowerCase();

        if (!userEmail.endsWith("@student.kit.edu")) {
            return new BasicResponse("Email must end with '@student.kit.edu' (was: " + request.email() + ")",false);
        }


        String otp = createAndSaveOTP(userEmail);

        mailService.sendLoginMail(userEmail, otp);

        //FOR FUTURE: Don't tell, whether user has an existing account (only e.g. if user has account email has been sent)
        return new BasicResponse("Login OneTimePassword sent to: " + userEmail, true);
    }


    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {


        if (request.email() == null || request.email().isBlank()) {
            return new LoginResponse("Error, Email is required", false, null);
        }
        if (request.loginToken() == null || request.loginToken().isBlank()) {
            return new LoginResponse("Error, login token is required", false, null);
        }


        //Sanitize inputs
        String userEmail = request.email().trim().toLowerCase();
        String otp = request.loginToken().trim();

        boolean valid = verifyOTP(userEmail, otp); //Also consumes OTP

        if (!valid) {
            //TODO: More fine-grained error message (e.g. token expired...)
            return new LoginResponse("Invalid token", false, null);
        }


        Student student = studentService.findByKitEmail(userEmail);


        if(student == null) {
            student = new Student();
            student.setKitEmail(userEmail);

            String userName = NameGenerator.generateUsername();

            student.setUsername(userName);

            student.setEmailVerifiedAt(LocalDateTime.now());
            student.setCredibilityScore(0);

            studentService.addStudent(student);
        }

        String authToken = createAndSaveAuthToken(student);

        //Send successful login mail (Try to get information on ip e.g.)
        String ip = httpRequest.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = httpRequest.getRemoteAddr();
        }
        String userAgent = httpRequest.getHeader("User-Agent");

        mailService.sendSuccessfulLogin(userEmail, ip, userAgent);


        return new LoginResponse("Login successful", true, authToken);
    }


    public BasicResponse me(String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new BasicResponse("Not logged in", false);
        }

        String token = authHeader.substring("Bearer ".length());

        String email = verifyAuthToken(token);

        if (email == null) {
            return new BasicResponse("Not logged in", false);
        }

        return new BasicResponse("Logged in as: " + email, true);

    }


    public BasicResponse validate(String authHeader, ValidateCredsRequest request) {

        BasicResponse response = validateCredentials(authHeader, request.email());

        if (!response.success()) {
            return response;
        }

        return new BasicResponse("Correct auth-Token for email: " + request.email(), true);
    }





    //Methods used by (other) Services

    /**
     * Creates the OTP and saves it in the login table.
     */
    private String createAndSaveOTP(String email) {

        String otp = TokenGenerator.generateOneTimePassword();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));

        LocalDateTime expiresAt = berlinTime.plusMinutes(5).toLocalDateTime();


        OneTimePassword oneTimePassword = new OneTimePassword();

        oneTimePassword.setEmail(email);
        //oneTimePassword.setValue(otp);
        oneTimePassword.setHash(HashGenerator.hashPassword(otp));
        oneTimePassword.setExpiresAt(expiresAt);

        oneTimePasswordRepository.save(oneTimePassword);


        return otp;
    }





    private String createAndSaveAuthToken(Student student) {

        String authToken = TokenGenerator.generateToken();

        ZonedDateTime berlinTime = ZonedDateTime.now(ZoneId.of("Europe/Berlin"));
        LocalDateTime expiresAt = berlinTime.plusDays(365).toLocalDateTime();

        String email = student.getKitEmail();

        Token token = new Token();
        token.setEmail(email);
        token.setHash(HashGenerator.hashToken(authToken));
        token.setExpiresAt(expiresAt);
        token.setStudent(student);

        tokenRepository.save(token);

        return authToken;
    }



    public int invalidateAllAuthTokensForEmail(String email) {

        List<Token> tokens = tokenRepository.findByEmail(email);

        for (Token token : tokens) {
            token.setRevoked(true);
        }

        return tokens.size();
    
    }


    public Student verifyUser(String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String authToken = authHeader.substring("Bearer ".length());

        Token token = tokenRepository
                .findByHashAndRevokedFalseAndExpiresAtAfter(
                        HashGenerator.hashToken(authToken),
                        LocalDateTime.now()
                )
                .orElse(null);

        if (token == null) {
            return null;
        }

        return token.getStudent();
    }



    private BasicResponse validateCredentials(String authHeader, String emailAddress){

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


    //Repository Methods:

    private String verifyAuthToken(String authToken) {

        Token token = tokenRepository
                .findByHashAndRevokedFalseAndExpiresAtAfter(
                        HashGenerator.hashToken(authToken),
                        LocalDateTime.now()
                )
                .orElse(null);

        if (token == null) {
            return null;
        }

        return token.getEmail();
    }



    /**
     * Verifies the OTP by checking if it exists, is unused, and isnt expired.
     */
    private boolean verifyOTP(String email, String otp) {

        List<OneTimePassword> otps = oneTimePasswordRepository.findByEmailAndUsedFalseAndExpiresAtAfter(email, LocalDateTime.now());

        for (OneTimePassword storedOtp : otps) {

            if (HashGenerator.passwordMatchesHash(otp, storedOtp.getHash())) {

                storedOtp.setUsed(true);
                oneTimePasswordRepository.save(storedOtp);

                return true;
            }

        }

        return false;
    }



}