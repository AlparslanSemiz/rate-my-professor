package com.pse.rating;

import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.model.Token;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.repository.RatingRepository;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.util.HashGenerator;
import com.pse.social.repository.*;
import com.pse.support.TestDeliveryConfig;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({
        TestDeliveryConfig.class,
        com.pse.support.TestGitLabConfig.class
})
class RatingApiIntegrationTests {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    TokenRepository tokenRepository;

    @Autowired
    RatingRepository ratingRepository;

    @Autowired
    LectureRepository lectureRepository;

    @Autowired
    ProfessorRepository professorRepository;

    @Autowired
    AuditLogRepository auditLogRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    WarningRepository warningRepository;

    @Autowired
    AnswerReportRepository answerReportRepository;

    @Autowired
    AnswerVoteRepository answerVoteRepository;

    @Autowired
    AnswerRepository answerRepository;

    @Autowired
    CommentReportRepository commentReportRepository;

    @Autowired
    CommentVoteRepository commentVoteRepository;

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    BugReportRepository bugReportRepository;

    @Autowired
    OneTimePasswordRepository otpRepository;

    @Autowired
    AuthRateLimitBucketRepository rateLimitRepository;

    @Autowired
    AdminRepository adminRepository;


    @BeforeEach
    void cleanDatabase() {

        auditLogRepository.deleteAll();

        notificationRepository.deleteAll();
        warningRepository.deleteAll();

        answerReportRepository.deleteAll();
        answerVoteRepository.deleteAll();
        answerRepository.deleteAll();

        commentReportRepository.deleteAll();
        commentVoteRepository.deleteAll();
        commentRepository.deleteAll();

        bugReportRepository.deleteAll();

        ratingRepository.deleteAll();

        tokenRepository.deleteAll();
        otpRepository.deleteAll();
        rateLimitRepository.deleteAll();

        adminRepository.deleteAll();

        lectureRepository.deleteAll();
        professorRepository.deleteAll();

        studentRepository.deleteAll();
    }


    @Test
    void studentCanSubmitRatingAndPublicCanReadAverage() throws Exception {

        Session student =
                createSession(
                        "rater@student.kit.edu"
                );

        Lecture lecture =
                createLecture();


        mockMvc.perform(
                        post("/ratings/rate")
                                .header(
                                        "Authorization",
                                        bearer(
                                                student.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureId":"%s",
                                          "topics":[
                                            {
                                              "category":"ORGANIZATION",
                                              "value":4
                                            }
                                          ]
                                        }
                                        """.formatted(
                                        lecture.getId()
                                ))
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Rating submitted successfully"
                                )
                );


        assertEquals(
                1,
                ratingRepository.count()
        );


        mockMvc.perform(
                        get(
                                "/ratings/{lectureId}",
                                lecture.getId()
                        )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.ratings",
                                hasSize(2))
                )
                .andExpect(
                        jsonPath(
                                "$.ratings[?(@.category == 'ORGANIZATION')].value"
                        ).value(4.0)
                )
                .andExpect(
                        jsonPath(
                                "$.ratings[?(@.category == 'OVERALL')].value"
                        ).value(4.0)
                );
    }


    @Test
    void submittingRatingAgainOverwritesExistingRating() throws Exception {

        Session student =
                createSession(
                        "rater@student.kit.edu"
                );

        Lecture lecture =
                createLecture();


        mockMvc.perform(
                        post("/ratings/rate")
                                .header(
                                        "Authorization",
                                        bearer(
                                                student.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureId":"%s",
                                          "topics":[
                                            {
                                              "category":"ORGANIZATION",
                                              "value":2
                                            }
                                          ]
                                        }
                                        """.formatted(
                                        lecture.getId()
                                ))
                )
                .andExpect(status().isOk());


        assertEquals(
                1,
                ratingRepository.count()
        );


        // Same student + same lecture again
        mockMvc.perform(
                        post("/ratings/rate")
                                .header(
                                        "Authorization",
                                        bearer(
                                                student.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureId":"%s",
                                          "topics":[
                                            {
                                              "category":"ORGANIZATION",
                                              "value":5
                                            }
                                          ]
                                        }
                                        """.formatted(
                                        lecture.getId()
                                ))
                )
                .andExpect(status().isOk());


        // Still only ONE Rating row
        assertEquals(
                1,
                ratingRepository.count()
        );


        mockMvc.perform(
                        get(
                                "/ratings/own/{lectureId}",
                                lecture.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(
                                                student.rawToken()
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                )
                .andExpect(
                        jsonPath("$.ratings",
                                hasSize(2))
                )
                .andExpect(
                        jsonPath(
                                "$.ratings[?(@.category == 'ORGANIZATION')].value"
                        ).value(5.0)
                )
                .andExpect(
                        jsonPath(
                                "$.ratings[?(@.category == 'OVERALL')].value"
                        ).value(5.0)
                );
    }


    @Test
    void ownRatingReturnsErrorWhenStudentHasNotRatedLecture() throws Exception {

        Session student =
                createSession(
                        "student@student.kit.edu"
                );

        Lecture lecture =
                createLecture();


        mockMvc.perform(
                        get(
                                "/ratings/own/{lectureId}",
                                lecture.getId()
                        )
                                .header(
                                        "Authorization",
                                        bearer(
                                                student.rawToken()
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(false)
                )
                .andExpect(
                        jsonPath("$.message")
                                .value(
                                        "Error, couldnt find rating for Lecture: "
                                                + lecture.getId()
                                )
                );
    }


    @Test
    void differentStudentsAreAveragedTogether() throws Exception {

        Session firstStudent =
                createSession(
                        "first@student.kit.edu"
                );

        Session secondStudent =
                createSession(
                        "second@student.kit.edu"
                );

        Lecture lecture =
                createLecture();


        submitOrganizationRating(
                firstStudent,
                lecture,
                4
        );

        submitOrganizationRating(
                secondStudent,
                lecture,
                2
        );


        assertEquals(
                2,
                ratingRepository.count()
        );


        mockMvc.perform(
                        get(
                                "/ratings/{lectureId}",
                                lecture.getId()
                        )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath(
                                "$.ratings[?(@.category == 'ORGANIZATION')].value"
                        ).value(3.0)
                )
                .andExpect(
                        jsonPath(
                                "$.ratings[?(@.category == 'OVERALL')].value"
                        ).value(3.0)
                );
    }


    @Test
    void submittingRatingRequiresAuthentication() throws Exception {

        Lecture lecture = createLecture();


        mockMvc.perform(
                        post("/ratings/rate")
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureId":"%s",
                                          "topics":[
                                            {
                                              "category":"ORGANIZATION",
                                              "value":4
                                            }
                                          ]
                                        }
                                        """.formatted(
                                        lecture.getId()
                                ))
                )
                .andExpect(
                        status().isUnauthorized()
                );
    }


    @Test
    void ownRatingRequiresAuthentication() throws Exception {

        Lecture lecture = createLecture();


        mockMvc.perform(
                        get(
                                "/ratings/own/{lectureId}",
                                lecture.getId()
                        )
                )
                .andExpect(
                        status().isUnauthorized()
                );
    }


    @Test
    void ratingAverageIsPublic() throws Exception {

        Lecture lecture = createLecture();


        mockMvc.perform(
                        get(
                                "/ratings/{lectureId}",
                                lecture.getId()
                        )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );
    }



    private void submitOrganizationRating(Session session, Lecture lecture, int value) throws Exception {

        mockMvc.perform(
                        post("/ratings/rate")
                                .header(
                                        "Authorization",
                                        bearer(
                                                session.rawToken()
                                        )
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content("""
                                        {
                                          "lectureId":"%s",
                                          "topics":[
                                            {
                                              "category":"ORGANIZATION",
                                              "value":%d
                                            }
                                          ]
                                        }
                                        """.formatted(
                                        lecture.getId(),
                                        value
                                ))
                )
                .andExpect(
                        status().isOk()
                )
                .andExpect(
                        jsonPath("$.success")
                                .value(true)
                );
    }


    private Session createSession(String email) {

        Student student = createStudent(email);

        String rawToken = TokenGenerator.generateToken();

        Token token = new Token();

        token.setEmail(email);
        token.setStudent(student);

        token.setHash(HashGenerator.hashToken(rawToken));

        token.setExpiresAt(LocalDateTime.now().plusHours(12));

        token = tokenRepository.saveAndFlush(token);


        return new Session(student, token, rawToken);
    }


    private Student createStudent(String email) {

        Student student = new Student();

        student.setKitEmail(email);

        student.setUsername(
                email.substring(
                        0,
                        email.indexOf('@')
                )
        );

        student.setCredibilityScore(0);

        student.setStatus(UserStatus.ACTIVE);

        student.setEmailVerifiedAt(LocalDateTime.now());


        return studentRepository.saveAndFlush(student);
    }


    private Lecture createLecture() {

        Lecture lecture = new Lecture();

        lecture.setName("Algorithms");
        lecture.setCode("CS101");

        lecture.setSemesterYear(2026);

        lecture.setSemesterSeason(SemesterSeason.SS);

        lecture.setActive(true);


        return lectureRepository.saveAndFlush(lecture);
    }


    private String bearer(String token) {
        return "Bearer " + token;
    }


    private record Session(
            Student student,
            Token token,
            String rawToken
    ) {
    }
}