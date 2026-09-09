package com.pse.user;

import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.model.Token;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.model.Rating;
import com.pse.rating.repository.RatingRepository;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.security.TokenHasher;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.NotificationRepository;
import com.pse.support.TestDeliveryConfig;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.pse.support.ApiIntegrationTest;
import com.pse.support.DatabaseReset;


@ApiIntegrationTest
class AccountApiIntegrationTests {

    @Autowired
    DatabaseReset databaseReset;

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    TokenRepository tokenRepository;


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
    CommentRepository commentRepository;
    @Autowired
    RatingRepository ratingRepository;
    @Autowired
    OneTimePasswordRepository otpRepository;
    @Autowired
    AuthRateLimitBucketRepository rateLimitRepository;
    @Autowired
    AdminRepository adminRepository;
    @Autowired
    LectureRepository lectureRepository;
    @Autowired
    ProfessorRepository professorRepository;

    @BeforeEach
    void cleanDatabase() {
        databaseReset.all();







    }


    @Test
    void getUserInformationReturnsProfileOfAuthenticatedStudent()
            throws Exception {

        Session session =
                createSession("information@student.kit.edu");


        mockMvc.perform(
                        get("/account/information")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.username")
                        .value("information"))
                .andExpect(jsonPath("$.averageRating").value(0))
                .andExpect(jsonPath("$.ratingsCount").value(0))
                .andExpect(jsonPath("$.commentsWritten").value(0))
                .andExpect(jsonPath("$.credibilityScore").value(0));
    }


    @Test
    void getUserRatingsReturnsEmptyListWhenStudentHasNoRatings()
            throws Exception {

        Session session =
                createSession("ratings@student.kit.edu");


        mockMvc.perform(
                        get("/account/ratings")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Success, found 0 ratings."))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.ratings").isArray())
                .andExpect(jsonPath("$.ratings", hasSize(0)));
    }


    @Test
    void logoutInvalidatesAllSessionsOfStudent()
            throws Exception {

        Session session =
                createSession("logout@student.kit.edu");

        assertThat(tokenRepository.count()).isEqualTo(1);


        mockMvc.perform(
                        post("/account/logout")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Logged out successfully (1 sessions)"));


        assertThat(tokenRepository.count()).isEqualTo(1);


        mockMvc.perform(
                        get("/account/information")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isUnauthorized());
    }


    @Test
    void deleteAccountSoftDeletesStudentAndInvalidatesSession()
            throws Exception {

        Session session =
                createSession("delete@student.kit.edu");


        mockMvc.perform(
                        patch("/account/deleteAccount")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value(
                                "Deleted Account successfully: "
                                        + "delete@student.kit.edu"
                        ));


        Student deletedStudent =
                studentRepository
                        .findById(session.student().getId())
                        .orElseThrow();

        assertThat(deletedStudent.getStatus()).isEqualTo(UserStatus.DELETED);


        assertThat(tokenRepository.count()).isEqualTo(1);


        mockMvc.perform(
                        get("/account/information")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isUnauthorized());
    }


    @Test
    void accountEndpointsRequireAuthentication()
            throws Exception {

        mockMvc.perform(
                        get("/account/information")
                )
                .andExpect(status().isUnauthorized());


        mockMvc.perform(
                        get("/account/ratings")
                )
                .andExpect(status().isUnauthorized());


        mockMvc.perform(
                        post("/account/logout")
                )
                .andExpect(status().isUnauthorized());


        mockMvc.perform(
                        patch("/account/deleteAccount")
                )
                .andExpect(status().isUnauthorized());
    }



    /**
     * The order of {@code ratings[]} on {@code GET /account/ratings}.
     *
     * <p>F-21's shape on the one list the sweep behind F-35 did not reach.
     * {@code Student.ratings} is a plain JPA bag, so the array came back in whatever order
     * the database chose and could differ between two requests for the same account. The
     * nested {@code lecture.professors} was already sorted -- it goes through
     * {@code LectureResponseMapper}, which carries F-21's own comparator -- so the item was
     * ordered inside and unordered outside.
     *
     * <p>Newest first, matching {@code CommentRepository}'s listings, with the id as a
     * tiebreaker so two ratings written in the same instant still come out the same way
     * twice. Written against timestamps set out of insertion order on purpose: a fixture
     * inserted in the answer's order would pass on the bag as well and prove nothing.
     */
    @Test
    void userRatingsComeBackNewestFirstRatherThanInWhateverOrderTheDatabaseChose()
            throws Exception {

        Session session =
                createSession("rating-order@student.kit.edu");

        rateLecture(session.student(), "Oldest", LocalDateTime.of(2026, 1, 1, 9, 0));
        rateLecture(session.student(), "Newest", LocalDateTime.of(2026, 3, 1, 9, 0));
        rateLecture(session.student(), "Middle", LocalDateTime.of(2026, 2, 1, 9, 0));

        mockMvc.perform(
                        get("/account/ratings")
                                .header(
                                        "Authorization",
                                        bearer(session.rawToken())
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ratings", hasSize(3)))
                .andExpect(jsonPath("$.ratings[0].lecture.name").value("Newest"))
                .andExpect(jsonPath("$.ratings[1].lecture.name").value("Middle"))
                .andExpect(jsonPath("$.ratings[2].lecture.name").value("Oldest"));
    }


    private void rateLecture(Student student, String lectureName, LocalDateTime writtenAt) {

        Lecture lecture = new Lecture();

        lecture.setName(lectureName);
        lecture.setCode(lectureName);
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SS);

        lecture = lectureRepository.saveAndFlush(lecture);

        Rating rating = new Rating();

        rating.setStudent(student);
        rating.setLecture(lecture);

        rating = ratingRepository.saveAndFlush(rating);

        // Written straight to the column. @CreationTimestamp maps created_at as
        // non-updatable, so setCreatedAt on the managed entity is dropped without an error
        // and every row keeps the instant it was inserted at -- which would leave the three
        // rows in insertion order and let this test pass on an unordered bag.
        jdbcTemplate.update(
                "UPDATE ratings SET created_at = ? WHERE id = ?",
                writtenAt,
                rating.getId()
        );
    }


    private Session createSession(String email) {

        Student student = createStudent(email);

        String rawToken =
                TokenGenerator.generateToken();

        Token token = new Token();

        token.setEmail(email);
        token.setStudent(student);
        token.setHash(
                TokenHasher.hash(rawToken)
        );
        token.setExpiresAt(
                LocalDateTime.now().plusHours(12)
        );

        token = tokenRepository.saveAndFlush(token);

        return new Session(
                student,
                token,
                rawToken
        );
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