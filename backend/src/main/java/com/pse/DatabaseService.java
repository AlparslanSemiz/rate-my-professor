package com.pse;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pse.model.Lecture;
import com.pse.model.Professor;
import com.pse.model.Student;
import com.pse.model.auth.OneTimePassword;
import com.pse.model.auth.Token;
import com.pse.repositories.LectureRepository;
import com.pse.repositories.OneTimePasswordRepository;
import com.pse.repositories.ProfessorRepository;
import com.pse.repositories.StudentRepository;
import com.pse.repositories.TokenRepository;
import com.pse.response.LectureResponse;
import com.pse.response.ProfessorResponse;



/**
 * To communicate to database in one single class
 * Could be made as an interface
 */
@Service
public class DatabaseService {

    
    @Autowired
    private OneTimePasswordRepository oneTimePasswordRepository;
    @Autowired
    private TokenRepository tokenRepository;
    @Autowired
    private ProfessorRepository professorRepository;
    @Autowired
    private LectureRepository lectureRepository;
    @Autowired
    private StudentRepository studentRepository;
    


    public void saveOTP(String email, String otp, LocalDateTime expiresAt){

        OneTimePassword oneTimePassword = new OneTimePassword();

        oneTimePassword.setEmail(email);
        oneTimePassword.setValue(otp);
        oneTimePassword.setExpiresAt(expiresAt);

        oneTimePasswordRepository.save(oneTimePassword);

    }


    public boolean validateOTP(String email, String otp) {

        return oneTimePasswordRepository.findByEmailAndValueAndUsedFalseAndExpiresAtAfter(
                    email,
                    otp,
                    LocalDateTime.now()
                )
            .isPresent();
    }

    /**
     * Set OTP to used in database
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


    public void saveAuthToken(String email, String authToken, LocalDateTime expiresAt, Student student){

        Token token = new Token();

        token.setEmail(email);
        token.setValue(authToken);
        token.setExpiresAt(expiresAt);
        token.setStudent(student);

        tokenRepository.save(token);

    }

    /**
     * Validates the auth token, and if valid return the corresponding user Email
     */
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

    
    public List<ProfessorResponse> getProfessors() {


        List<Professor> professors =
            professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {

            responses.add(
                    new ProfessorResponse(
                                professor.getId(),
                                professor.getFirstName(),
                                professor.getLastName(),
                                professor.getAverageRating(),
                                professor.getRatingCount()
                    )
            );
        }

        return responses;


    }

    public List<LectureResponse> getLectures() {
        List<Lecture> lectures = lectureRepository.findByActiveTrueOrderByNameAsc();

        List<LectureResponse> responses = new ArrayList<>();

        for (Lecture lecture : lectures) {

            responses.add(
                    new LectureResponse(
                            lecture.getId(),
                            lecture.getName(),
                            lecture.getCode(),
                            lecture.getSemesterYear(),
                            lecture.getSemesterSeason(),
                            lecture.isActive(),
                            lecture.getProfessor().getId(),
                            lecture.getProfessor().getFirstName(),
                            lecture.getProfessor().getLastName(),
                            lecture.getComments().size(),
                            lecture.getRatings().size()
                    )
            );  
        }

        return responses;
    }

    public boolean studentExists(String userEmail) {
        return studentRepository.existsByKitEmail(userEmail);
    }

    public Student findStudentByKitEmail(String email) {
        return studentRepository.findByKitEmail(email);
    }

    public void addStudent(Student student) {
        studentRepository.save(student);
    }
    

}