package com.pse.lecture;

import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.model.Admin;
import com.pse.moderation.repository.AdminRepository;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.shared.enums.SemesterSeason;

import com.pse.shared.enums.UserStatus;
import com.pse.shared.util.HashGenerator;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import org.h2.engine.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.h2.engine.Engine.createSession;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.pse.support.TestDeliveryConfig;
import org.springframework.context.annotation.Import;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({
        TestDeliveryConfig.class,
        com.pse.support.TestGitLabConfig.class
})
class LectureApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LectureRepository lectureRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    AdminRepository adminRepository;

    @Autowired
    TokenRepository tokenRepository;


    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
        adminRepository.deleteAll();
        lectureRepository.deleteAll();
        professorRepository.deleteAll();
        studentRepository.deleteAll();
    }

    @Test
    void getLecturesReturnsActiveLectures() throws Exception {

        Lecture lecture = new Lecture();
        lecture.setName("Lineare Algebra 1");
        lecture.setCode("LA1");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SUMMER);
        lecture.setActive(true);

        lectureRepository.save(lecture);

        mockMvc.perform(get("/data/lectures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.lectures", hasSize(1)))
                .andExpect(jsonPath("$.lectures[0].name")
                        .value("Lineare Algebra 1"))
                .andExpect(jsonPath("$.lectures[0].code")
                        .value("LA1"));
    }


    @Test
    void getLecturesDoesNotReturnInactiveLectures() throws Exception {

        Lecture activeLecture = new Lecture();
        activeLecture.setName("Lineare Algebra 1");
        activeLecture.setSemesterYear(2026);
        activeLecture.setSemesterSeason(SemesterSeason.SUMMER);
        activeLecture.setActive(true);

        Lecture inactiveLecture = new Lecture();
        inactiveLecture.setName("Alte Vorlesung");
        inactiveLecture.setSemesterYear(2024);
        inactiveLecture.setSemesterSeason(SemesterSeason.WINTER);
        inactiveLecture.setActive(false);

        lectureRepository.save(activeLecture);
        lectureRepository.save(inactiveLecture);

        mockMvc.perform(get("/data/lectures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.lectures", hasSize(1)))
                .andExpect(jsonPath("$.lectures[0].name")
                        .value("Lineare Algebra 1"));
    }


    @Test
    void getLectureReturnsLectureWhenItExists() throws Exception {

        Lecture lecture = new Lecture();
        lecture.setName("Lineare Algebra 1");
        lecture.setCode("LA1");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SUMMER);

        lecture = lectureRepository.save(lecture);

        mockMvc.perform(
                        get("/data/lectures/{id}", lecture.getId())
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.lecture.name")
                        .value("Lineare Algebra 1"))
                .andExpect(jsonPath("$.lecture.code")
                        .value("LA1"))
                .andExpect(jsonPath("$.lecture.id")
                        .value(lecture.getId().toString()));
    }

    @Test
    void getLectureReturnsFailureWhenLectureDoesNotExist()
            throws Exception {

        UUID lectureId = UUID.randomUUID();

        mockMvc.perform(
                        get("/data/lectures/{id}", lectureId)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.lecture").isEmpty());
    }


    @Test
    void adminCanAddLecture() throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        Professor professor = new Professor();
        professor.setFirstName("Peter");
        professor.setLastName("Müller");
        professor = professorRepository.saveAndFlush(professor);

        mockMvc.perform(
                        post("/data/lectures")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "name": "Lineare Algebra 1",
                                      "code": "LA1",
                                      "semesterYear": 2026,
                                      "semesterSeason": "SUMMER",
                                      "professorIds": [
                                        "%s"
                                      ]
                                    }
                                    """.formatted(professor.getId()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Lecture lecture = lectureRepository
                .findByName("Lineare Algebra 1")
                .orElseThrow();

        assertEquals("LA1", lecture.getCode());
        assertEquals(2026, lecture.getSemesterYear());
        assertTrue(lecture.isActive());

        assertEquals(1, lecture.getProfessors().size());

        assertEquals(
                professor.getId(),
                lecture.getProfessors()
                        .iterator()
                        .next()
                        .getId()
        );
    }

    @Test
    void nonAdminCannotAddLecture() throws Exception {

        Session student =
                createSession("student@student.kit.edu", false);

        Professor professor = new Professor();
        professor.setFirstName("Peter");
        professor.setLastName("Müller");
        professor = professorRepository.saveAndFlush(professor);

        mockMvc.perform(
                        post("/data/lectures")
                                .header(
                                        "Authorization",
                                        bearer(student.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "name": "Lineare Algebra 1",
                                      "code": "LA1",
                                      "semesterYear": 2026,
                                      "semesterSeason": "SUMMER",
                                      "professorIds": [
                                        "%s"
                                      ]
                                    }
                                    """.formatted(professor.getId()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("User is not authorized to add lectures"));

        assertTrue(
                lectureRepository
                        .findByName("Lineare Algebra 1")
                        .isEmpty()
        );
    }


    @Test
    void cannotAddLectureWithExistingName() throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        Lecture existingLecture = new Lecture();
        existingLecture.setName("Lineare Algebra 1");
        existingLecture.setCode("LA1");
        existingLecture.setSemesterYear(2026);
        existingLecture.setSemesterSeason(SemesterSeason.SUMMER);

        lectureRepository.save(existingLecture);

        Professor professor = new Professor();
        professor.setFirstName("Peter");
        professor.setLastName("Müller");
        professor = professorRepository.saveAndFlush(professor);

        mockMvc.perform(
                        post("/data/lectures")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "name": "Lineare Algebra 1",
                                      "code": "LA1-NEW",
                                      "semesterYear": 2026,
                                      "semesterSeason": "SUMMER",
                                      "professorIds": [
                                        "%s"
                                      ]
                                    }
                                    """.formatted(professor.getId()))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value(
                                "Lecture already exists: Lineare Algebra 1"
                        ));
    }


    @Test
    void cannotAddLectureWhenProfessorDoesNotExist()
            throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        UUID unknownProfessorId =
                UUID.randomUUID();

        mockMvc.perform(
                        post("/data/lectures")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "name": "Lineare Algebra 1",
                                      "code": "LA1",
                                      "semesterYear": 2026,
                                      "semesterSeason": "SUMMER",
                                      "professorIds": [
                                        "%s"
                                      ]
                                    }
                                    """.formatted(unknownProfessorId))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value(
                                "Professor not found: "
                                        + unknownProfessorId
                        ));

        assertTrue(
                lectureRepository
                        .findByName("Lineare Algebra 1")
                        .isEmpty()
        );
    }


    @Test
    void addLectureReturnsBadRequestForInvalidRequest()
            throws Exception {

        Session admin =
                createSession("admin@student.kit.edu", true);

        mockMvc.perform(
                        post("/data/lectures")
                                .header(
                                        "Authorization",
                                        bearer(admin.rawToken())
                                )
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                      "name": ""
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

        return new Session(student, admin, token, raw);
    }

    private Student createStudent(String email) {

        Student student = new Student();

        student.setKitEmail(email);
        student.setUsername(email.substring(0, email.indexOf('@')));
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