package com.pse.professor;

import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.model.Token;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.model.Admin;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.repository.RatingRepository;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.util.HashGenerator;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({
        TestDeliveryConfig.class,
        com.pse.support.TestGitLabConfig.class
})
class ProfessorApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private LectureRepository lectureRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private AnswerReportRepository answerReportRepository;

    @Autowired
    private AnswerVoteRepository answerVoteRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private CommentReportRepository commentReportRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private WarningRepository warningRepository;

    @Autowired
    private BugReportRepository bugReportRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private OneTimePasswordRepository otpRepository;

    @Autowired
    private AuthRateLimitBucketRepository rateLimitRepository;


    @BeforeEach
    void setUp() {
        auditLogRepository.deleteAll();
        notificationRepository.deleteAll();
        warningRepository.deleteAll();

        answerReportRepository.deleteAll();
        answerVoteRepository.deleteAll();
        answerRepository.deleteAll();

        commentReportRepository.deleteAll();
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
    void getProfessorsReturnsActiveProfessors() throws Exception {

        Professor professor = new Professor();
        professor.setFirstName("Stefan");
        professor.setLastName("Kühnlein");
        professor.setActive(true);

        professorRepository.save(professor);

        mockMvc.perform(get("/data/professor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.professors", hasSize(1)))
                .andExpect(jsonPath("$.professors[0].firstName")
                        .value("Stefan"))
                .andExpect(jsonPath("$.professors[0].lastName")
                        .value("Kühnlein"))
                .andExpect(jsonPath("$.professors[0].active")
                        .value(true));
    }


    @Test
    void getProfessorsDoesNotReturnInactiveProfessors() throws Exception {

        Professor activeProfessor = new Professor();
        activeProfessor.setFirstName("Stefan");
        activeProfessor.setLastName("Kühnlein");
        activeProfessor.setActive(true);

        Professor inactiveProfessor = new Professor();
        inactiveProfessor.setFirstName("Müller");
        inactiveProfessor.setLastName("Quade");
        inactiveProfessor.setActive(false);

        professorRepository.save(activeProfessor);
        professorRepository.save(inactiveProfessor);

        mockMvc.perform(get("/data/professor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.professors", hasSize(1)))
                .andExpect(jsonPath("$.professors[0].firstName")
                        .value("Stefan"))
                .andExpect(jsonPath("$.professors[0].lastName")
                        .value("Kühnlein"));
    }


    @Test
    void getProfessorReturnsProfessorWhenItExists() throws Exception {

        Professor professor = new Professor();
        professor.setFirstName("Stefan");
        professor.setLastName("Kühnlein");
        professor.setActive(true);

        professor = professorRepository.saveAndFlush(professor);

        mockMvc.perform(
                        get("/data/professor/{id}", professor.getId())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.professor.id")
                        .value(professor.getId().toString()))
                .andExpect(jsonPath("$.professor.firstName")
                        .value("Stefan"))
                .andExpect(jsonPath("$.professor.lastName")
                        .value("Kühnlein"));
    }


    @Test
    void getProfessorReturnsFailureWhenProfessorDoesNotExist()
            throws Exception {

        UUID professorId = UUID.randomUUID();

        mockMvc.perform(
                        get("/data/professor/{id}", professorId)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.professor").isEmpty());
    }


    @Test
    void getProfessorIDReturnsIdWhenProfessorExists()
            throws Exception {

        Professor professor = new Professor();
        professor.setFirstName("Stefan");
        professor.setLastName("Kühnlein");

        professor = professorRepository.saveAndFlush(professor);

        mockMvc.perform(
                        get("/data/professor/id")
                                .param("firstName", "Stefan")
                                .param("lastName", "Kühnlein")
                )
                .andExpect(status().isOk())
                .andExpect(content().string(
                        "\"" + professor.getId() + "\""
                ));
    }


    @Test
    void adminCanAddProfessor() throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        mockMvc.perform(
                        post("/data/professor")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "firstName": "Stefan",
                                          "lastName": "Kühnlein",
                                          "lectureIDs": []
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message")
                        .value("Professor added successfully"));

        Professor professor =
                professorRepository
                        .findByFirstNameAndLastName(
                                "Stefan",
                                "Kühnlein"
                        )
                        .orElseThrow();

        assertEquals(
                "Stefan",
                professor.getFirstName()
        );

        assertEquals(
                "Kühnlein",
                professor.getLastName()
        );
    }


    @Test
    void adminCanAddProfessorWithLecture() throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        Lecture lecture = new Lecture();
        lecture.setName("Lineare Algebra 1");
        lecture.setCode("LA1");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SUMMER);
        lecture.setActive(true);

        lecture = lectureRepository.saveAndFlush(lecture);

        mockMvc.perform(
                        post("/data/professor")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "firstName": "Stefan",
                                      "lastName": "Kühnlein",
                                      "lectureIDs": [
                                        "%s"
                                      ]
                                    }
                                    """.formatted(lecture.getId()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Professor professor =
                professorRepository
                        .findByFirstNameAndLastName(
                                "Stefan",
                                "Kühnlein"
                        )
                        .orElseThrow();

        mockMvc.perform(
                        get(
                                "/data/professor/{id}",
                                professor.getId()
                        )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath(
                        "$.professor.lectureIDs",
                        hasSize(1)
                ))
                .andExpect(jsonPath(
                        "$.professor.lectureIDs[0]"
                ).value(lecture.getId().toString()));
    }


    @Test
    void nonAdminCannotAddProfessor() throws Exception {

        Session student =
                createSession("student@student.kit.edu", false);

        mockMvc.perform(
                        post("/data/professor")
                                .header(
                                        "Authorization",
                                        bearer(student.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "firstName": "Stefan",
                                      "lastName": "Kühnlein",
                                      "lectureIDs": []
                                    }
                                    """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("Error, couldnt authenticate Admin"));

        assertTrue(
                professorRepository
                        .findByFirstNameAndLastName(
                                "Stefan",
                                "Kühnlein"
                        )
                        .isEmpty()
        );
    }


    @Test
    void cannotAddProfessorWithExistingName()
            throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        Professor existingProfessor = new Professor();
        existingProfessor.setFirstName("Stefan");
        existingProfessor.setLastName("Kühnlein");

        professorRepository.save(existingProfessor);

        mockMvc.perform(
                        post("/data/professor")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "firstName": "Stefan",
                                          "lastName": "Kühnlein",
                                          "lectureIDs": []
                                        }
                                        """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value(
                                "Professor already exists: Stefan Kühnlein"
                        ));
    }


    @Test
    void cannotAddProfessorWhenLectureDoesNotExist()
            throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        UUID lectureId = UUID.randomUUID();

        mockMvc.perform(
                        post("/data/professor")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "firstName": "Müller",
                                          "lastName": "Quade",
                                          "lectureIDs": [
                                            "%s"
                                          ]
                                        }
                                        """.formatted(lectureId))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value(
                                "Couldn't find lecture with lectureID: "
                                        + lectureId
                        ));

        assertTrue(
                professorRepository
                        .findByFirstNameAndLastName(
                                "Müller",
                                "Quade"
                        )
                        .isEmpty()
        );
    }


    @Test
    void addProfessorReturnsBadRequestForInvalidRequest()
            throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        mockMvc.perform(
                        post("/data/professor")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                          "firstName": "",
                                          "lastName": ""
                                        }
                                        """)
                )
                .andExpect(status().isBadRequest());
    }


    private Session createSession(String email, boolean adminRole) {

        Student student = createStudent(email);

        Admin admin = null;

        if (adminRole) {
            admin = new Admin();
            admin.setStudent(student);
            admin = adminRepository.saveAndFlush(admin);
        }

        String raw = TokenGenerator.generateToken();

        Token token = new Token();
        token.setEmail(email);
        token.setStudent(student);
        token.setHash(HashGenerator.hashToken(raw));
        token.setExpiresAt(LocalDateTime.now().plusHours(12));

        token = tokenRepository.saveAndFlush(token);

        return new Session(
                student,
                admin,
                token,
                raw
        );
    }


    private Student createStudent(String email) {

        Student student = new Student();

        student.setKitEmail(email);
        student.setUsername(
                email.substring(0, email.indexOf('@'))
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
            Admin admin,
            Token token,
            String rawToken
    ) {
    }
}