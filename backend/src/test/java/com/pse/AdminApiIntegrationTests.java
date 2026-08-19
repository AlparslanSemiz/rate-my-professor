package com.pse;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditActionScope;
import com.pse.audit.model.AuditActorType;
import com.pse.audit.model.AuditLog;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.repository.AuditLogRepository;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.model.OneTimePassword;
import com.pse.auth.model.Token;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.TokenGenerator;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.model.Admin;
import com.pse.moderation.model.BugReport;
import com.pse.moderation.model.Warning;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.repository.RatingRepository;
import com.pse.shared.enums.BugSeverity;
import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.util.HashGenerator;
import com.pse.shared.enums.ContentStatus;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.NotificationRepository;
import com.pse.support.TestDeliveryConfig;
import com.pse.support.TestDeliveryConfig.CapturingLoginCodeDelivery;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestDeliveryConfig.class)
class AdminApiIntegrationTests {

    @Autowired MockMvc mockMvc;
    @Autowired CapturingLoginCodeDelivery codeDelivery;
    @Autowired StudentRepository studentRepository;
    @Autowired AdminRepository adminRepository;
    @Autowired TokenRepository tokenRepository;
    @Autowired OneTimePasswordRepository otpRepository;
    @Autowired AuthRateLimitBucketRepository rateLimitRepository;
    @Autowired WarningRepository warningRepository;
    @Autowired CommentRepository commentRepository;
    @Autowired CommentReportRepository commentReportRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired LectureRepository lectureRepository;
    @Autowired ProfessorRepository professorRepository;
    @Autowired BugReportRepository bugReportRepository;
    @Autowired AuditLogRepository auditLogRepository;
    @Autowired AnswerRepository answerRepository;
    @Autowired AnswerReportRepository answerReportRepository;
    @Autowired AnswerVoteRepository answerVoteRepository;
    @Autowired RatingRepository ratingRepository;
    @MockitoSpyBean AuditWriter auditWriter;

    @BeforeEach
    void cleanDatabase() {
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
        codeDelivery.clear();
        reset(auditWriter);
    }

    @AfterEach
    void resetSpy() {
        reset(auditWriter);
    }

    @Test
    void adminLoginMeLogoutAndRevocationFollowContract() throws Exception {
        requestCode("  ADMIN@student.kit.edu ");
        String code = codeDelivery.codeFor("admin@student.kit.edu");

        String loginBody = """
                {"email":"ADMIN@student.kit.edu","loginToken":"%s"}
                """.formatted(code);
        String token = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(post("/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(loginBody))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.message").value("Login successful"))
                        .andExpect(jsonPath("$.success").value(true))
                        .andReturn().getResponse().getContentAsString(),
                "$.authToken"
        );

        mockMvc.perform(get("/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Authenticated"))
                .andExpect(jsonPath("$.user.kitEmail").value("admin@student.kit.edu"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));

        mockMvc.perform(post("/auth/logout").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out successfully"));

        mockMvc.perform(get("/users").header("Authorization", bearer(token)))
                .andExpect(status().isUnauthorized());
        org.junit.jupiter.api.Assertions.assertEquals(
                1,
                auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.ADMIN_LOGOUT)
                        .count()
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                1,
                auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.ADMIN_LOGIN)
                        .count()
        );
    }

    @Test
    void invalidUsedAndRateLimitedLoginCodesAreRejected() throws Exception {
        requestCode("student@student.kit.edu");
        String code = codeDelivery.codeFor("student@student.kit.edu");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"student@student.kit.edu","loginToken":"wrong"}
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"student@student.kit.edu","loginToken":"%s"}
                                """.formatted(code)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"student@student.kit.edu","loginToken":"%s"}
                                """.formatted(code)))
                .andExpect(status().isUnauthorized());

        requestCode("expired@student.kit.edu");
        String expiredCode = codeDelivery.codeFor("expired@student.kit.edu");
        OneTimePassword expired = otpRepository.findAll().stream()
                .filter(otp -> otp.getEmail().equals("expired@student.kit.edu"))
                .findFirst()
                .orElseThrow();
        expired.setExpiresAt(LocalDateTime.now(java.time.Clock.systemUTC()).minusMinutes(1));
        otpRepository.saveAndFlush(expired);
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"expired@student.kit.edu","loginToken":"%s"}
                                """.formatted(expiredCode)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\"}"))
                .andExpect(status().isBadRequest());

        requestCode("limited@student.kit.edu");
        requestCode("limited@student.kit.edu");
        requestCode("limited@student.kit.edu");
        mockMvc.perform(post("/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"limited@student.kit.edu\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void protectedEndpointsDifferentiateAnonymousStudentAndAdmin() throws Exception {
        mockMvc.perform(get("/users")).andExpect(status().isUnauthorized());

        Session student = createSession("student@student.kit.edu", false);
        mockMvc.perform(get("/users").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());

        Session admin = createSession("admin@student.kit.edu", true);
        mockMvc.perform(get("/users").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/missing-api-path"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void usersResponsesWarningsAndLifecycleUseServerSideActor() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("target@student.kit.edu", false);

        mockMvc.perform(get("/users")
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users", hasSize(2)))
                .andExpect(jsonPath("$.users[?(@.kitEmail == 'admin@student.kit.edu')].role")
                        .value(org.hamcrest.Matchers.hasItem("ADMIN")))
                .andExpect(jsonPath("$.users[?(@.kitEmail == 'target@student.kit.edu')].biography")
                        .value(org.hamcrest.Matchers.hasItem("")))
                .andExpect(jsonPath("$.users[0].warnings").isNumber())
                .andExpect(jsonPath("$.users[0].reports").isNumber());

        mockMvc.perform(get("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(target.student().getId().toString()))
                .andExpect(jsonPath("$.success").doesNotExist())
                .andExpect(jsonPath("$.joined", endsWith("Z")))
                .andExpect(jsonPath("$.lastOnline", endsWith("Z")));

        mockMvc.perform(get("/users/{id}", UUID.randomUUID())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userID":"00000000-0000-0000-0000-000000000001",
                                  "message":"  Repeated harassment  ",
                                  "createdFrom":{"id":"00000000-0000-0000-0000-000000000002"}
                                }
                                """))
                .andExpect(status().isOk());

        Warning saved = warningRepository.findAll().getFirst();
        org.junit.jupiter.api.Assertions.assertEquals(admin.admin().getId(), saved.getAdmin().getId());

        mockMvc.perform(get("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.warnings[0].createdFrom.id")
                        .value(admin.student().getId().toString()))
                .andExpect(jsonPath("$.warnings[0].createdAt", endsWith("Z")));

        mockMvc.perform(patch("/users/{id}/block", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        mockMvc.perform(get("/auth/me")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isUnauthorized());
        long auditCount = auditLogRepository.count();
        mockMvc.perform(patch("/users/{id}/block", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(auditCount, auditLogRepository.count());

        mockMvc.perform(patch("/users/{id}/unblock", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminAccountsAndEmptyWarningsAreProtected() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session otherAdmin = createSession("other-admin@student.kit.edu", true);

        mockMvc.perform(delete("/users/{id}", otherAdmin.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isConflict());
        mockMvc.perform(patch("/users/{id}/block", otherAdmin.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isConflict());
        mockMvc.perform(patch("/users/{id}/unblock", otherAdmin.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/users/{id}/warnings", otherAdmin.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Not allowed\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/users/{id}/warnings", otherAdmin.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"  \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reportedCommentsHaveNestedShapeAndNoOpDoesNotAudit() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Student reported = createStudent("reported@student.kit.edu");
        Student reporter = createStudent("reporter@student.kit.edu");
        Lecture lecture = createLecture();
        Comment comment = new Comment();
        comment.setContent("Reported content");
        comment.setStudent(reported);
        comment.setLecture(lecture);
        comment = commentRepository.saveAndFlush(comment);
        CommentReport report = new CommentReport();
        report.setComment(comment);
        report.setReporter(reporter);
        report.setReason(ReportReason.HARASSMENT);
        report.setExplanation(null);
        report = commentReportRepository.saveAndFlush(report);

        mockMvc.perform(get("/comments/reported")
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].postContext").value("CS101 — Algorithms"))
                .andExpect(jsonPath("$.comments[0].reportText").value(""))
                .andExpect(jsonPath("$.comments[0].reportedUser.id")
                        .value(reported.getId().toString()))
                .andExpect(jsonPath("$.comments[0].reporter.id")
                        .value(reporter.getId().toString()));

        mockMvc.perform(patch("/comments/reported/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REVIEWED\"}"))
                .andExpect(status().isOk());
        long audits = auditLogRepository.count();
        mockMvc.perform(patch("/comments/reported/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REVIEWED\"}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(audits, auditLogRepository.count());

        mockMvc.perform(patch("/comments/reported/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INVALID\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/comments/reported/{id}", UUID.randomUUID())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REVIEWED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void bugReportUpdatesBothFieldsInOneAuditEvent() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        BugReport report = new BugReport();
        report.setTitle("Upload crash");
        report.setDescription("Description");
        report.setSeverity(BugSeverity.LOW);
        report.setReporter(null);
        report = bugReportRepository.saveAndFlush(report);

        mockMvc.perform(get("/reports").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bugReports[0].reporterName").value("Unknown"))
                .andExpect(jsonPath("$.bugReports[0].reportedAt", endsWith("Z")));

        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTION_TAKEN\",\"severity\":\"HIGH\"}"))
                .andExpect(status().isOk());

        AuditLog audit = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == AuditAction.BUG_REPORT_UPDATED)
                .findFirst()
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(2, audit.getChanges().size());
        long auditCount = auditLogRepository.count();

        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTION_TAKEN\",\"severity\":\"HIGH\"}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(auditCount, auditLogRepository.count());

        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"severity\":\"CRITICAL\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REVIEWED\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"severity\":\"INVALID\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/reports/{id}", UUID.randomUUID())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"REVIEWED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void auditFiltersAndStableCursorPaginationFollowContract() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Instant timestamp = Instant.parse("2026-07-23T10:00:00.000Z");
        saveAudit(admin, UUID.fromString("00000000-0000-0000-0000-000000000002"), timestamp);
        saveAudit(admin, UUID.fromString("00000000-0000-0000-0000-000000000001"), timestamp);

        String response = mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("limit", "1")
                        .param("q", "target@student.kit.edu")
                        .param("actorId", admin.student().getId().toString())
                        .param("action", "USER_BLOCKED")
                        .param("targetType", "USER")
                        .param("from", "2026-07-23T00:00:00.000Z")
                        .param("to", "2026-07-23T23:59:59.999Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.auditLogs", hasSize(1)))
                .andExpect(jsonPath("$.nextCursor").isString())
                .andReturn().getResponse().getContentAsString();
        String cursor = com.jayway.jsonpath.JsonPath.read(response, "$.nextCursor");

        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("limit", "1")
                        .param("cursor", cursor)
                        .param("q", "target@student.kit.edu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.auditLogs", hasSize(1)))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());

        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("cursor", "invalid"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("limit", "101"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("action", "INVALID"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("targetType", "INVALID"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("actorId", "invalid"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("actorType", "INVALID"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("from", "2026-07-24T00:00:00.000Z")
                        .param("to", "2026-07-23T00:00:00.000Z"))
                .andExpect(status().isBadRequest());

        admin.student().setUsername("renamed-admin");
        studentRepository.saveAndFlush(admin.student());
        mockMvc.perform(get("/audit-logs/meta")
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actors[0].name").value("admin"))
                // The administrative page offers administrative actions only; student
                // activity and refusals are filtered by /activity-logs/meta.
                .andExpect(jsonPath("$.actions",
                        hasSize(AuditAction.of(AuditActionScope.ADMINISTRATIVE).size())))
                .andExpect(jsonPath("$.targetTypes", hasSize(AuditTargetType.values().length)))
                .andExpect(jsonPath("$.actorTypes", hasSize(AuditActorType.values().length)));

        // An action that belongs to the other page is a bad filter, not an empty result.
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("action", "USER_LOGIN"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/activity-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("action", "USER_BLOCKED"))
                .andExpect(status().isBadRequest());

        Session student = createSession("audit-student@student.kit.edu", false);
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentActivityIsRecordedUnderTheUserActorType() throws Exception {
        requestCode("activity@student.kit.edu");
        String token = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(post("/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"activity@student.kit.edu","loginToken":"%s"}
                                        """.formatted(codeDelivery.codeFor("activity@student.kit.edu"))))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(),
                "$.authToken"
        );

        Lecture lecture = createLecture();
        mockMvc.perform(post("/social/comments")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lectureID":"%s","content":"Clear and well paced"}
                                """.formatted(lecture.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/reports")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Profile upload fails","description":"Details","severity":"HIGH"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/auth/logout").header("Authorization", bearer(token)))
                .andExpect(status().isOk());

        AuditLog comment = auditOf(AuditAction.COMMENT_CREATED);
        org.junit.jupiter.api.Assertions.assertEquals(AuditActorType.USER, comment.getActorType());
        org.junit.jupiter.api.Assertions.assertEquals("STUDENT", comment.getActorRole());
        org.junit.jupiter.api.Assertions.assertEquals(AuditTargetType.COMMENT, comment.getTargetType());
        org.junit.jupiter.api.Assertions.assertEquals("CS101 — Algorithms", comment.getTargetLabel());
        org.junit.jupiter.api.Assertions.assertEquals(
                "Clear and well paced",
                comment.getMetadata().get("contentPreview")
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                AuditTargetType.BUG_REPORT,
                auditOf(AuditAction.BUG_REPORT_CREATED).getTargetType()
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                AuditTargetType.USER_SESSION,
                auditOf(AuditAction.USER_LOGIN).getTargetType()
        );
        auditOf(AuditAction.USER_LOGOUT);

        // The two log pages read the same table but must not show each other's events.
        // Nothing in this test performs an administrative action.
        Session admin = createSession("admin@student.kit.edu", true);
        mockMvc.perform(get("/activity-logs").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityLogs", hasSize(4)))
                .andExpect(jsonPath("$.activityLogs[0].actor.type").value("USER"));
        mockMvc.perform(get("/audit-logs").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.auditLogs", hasSize(0)));

        mockMvc.perform(get("/activity-logs/meta")
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actions",
                        hasSize(AuditAction.of(AuditActionScope.ACTIVITY).size())))
                .andExpect(jsonPath("$.actors[0].email").value("activity@student.kit.edu"));

        Session student = createSession("student@student.kit.edu", false);
        mockMvc.perform(get("/activity-logs").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/activity-logs")).andExpect(status().isUnauthorized());
    }

    @Test
    void ratingsAnswersAndStudentReportsAreRecorded() throws Exception {
        Session student = createSession("poster@student.kit.edu", false);
        Lecture lecture = createLecture();

        mockMvc.perform(post("/ratings/rate")
                        .header("Authorization", bearer(student.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lectureId":"%s","topics":[{"category":"ORGANIZATION","value":4}]}
                                """.formatted(lecture.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Comment comment = new Comment();
        comment.setStudent(student.student());
        comment.setLecture(lecture);
        comment.setContent("Original comment");
        comment.setStatus(ContentStatus.VISIBLE);
        comment = commentRepository.saveAndFlush(comment);

        mockMvc.perform(post("/social/answers")
                        .header("Authorization", bearer(student.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"commentID":"%s","content":"An answer"}
                                """.formatted(comment.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/social/comments/report")
                        .header("Authorization", bearer(student.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"commentID":"%s","reportReason":"HARASSMENT","explanation":"Rude"}
                                """.formatted(comment.getId())))
                .andExpect(status().isOk());

        AuditLog rating = auditOf(AuditAction.RATING_SUBMITTED);
        org.junit.jupiter.api.Assertions.assertEquals(AuditTargetType.RATING, rating.getTargetType());
        org.junit.jupiter.api.Assertions.assertEquals("CS101 — Algorithms", rating.getTargetLabel());

        AuditLog answer = auditOf(AuditAction.ANSWER_CREATED);
        org.junit.jupiter.api.Assertions.assertEquals(AuditTargetType.ANSWER, answer.getTargetType());
        org.junit.jupiter.api.Assertions.assertEquals(
                "Answer to poster in CS101 — Algorithms",
                answer.getTargetLabel()
        );

        AuditLog report = auditOf(AuditAction.COMMENT_REPORT_CREATED);
        org.junit.jupiter.api.Assertions.assertEquals(
                AuditTargetType.COMMENT_REPORT,
                report.getTargetType()
        );
        org.junit.jupiter.api.Assertions.assertEquals("HARASSMENT", report.getMetadata().get("reason"));
    }

    @Test
    void refusedLoginsAndDeniedRequestsSurviveTheirRolledBackRequest() throws Exception {
        Student blocked = createStudent("blocked@student.kit.edu");
        blocked.setStatus(UserStatus.BLOCKED);
        studentRepository.saveAndFlush(blocked);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"blocked@student.kit.edu","loginToken":"ABC234"}
                                """))
                .andExpect(status().isForbidden());

        createStudent("wrong-code@student.kit.edu");
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"wrong-code@student.kit.edu","loginToken":"ABC234"}
                                """))
                .andExpect(status().isUnauthorized());

        // No account, so no actor to attribute the attempt to and nothing recorded.
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@student.kit.edu","loginToken":"ABC234"}
                                """))
                .andExpect(status().isUnauthorized());

        org.junit.jupiter.api.Assertions.assertEquals(
                2,
                auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.LOGIN_REFUSED)
                        .count()
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                java.util.Set.of("ACCOUNT_BLOCKED", "INVALID_CODE"),
                auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.LOGIN_REFUSED)
                        .map(log -> log.getMetadata().get("reason"))
                        .collect(java.util.stream.Collectors.toSet())
        );

        Session student = createSession("denied@student.kit.edu", false);
        mockMvc.perform(get("/users").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());

        AuditLog refused = auditOf(AuditAction.ACCESS_REFUSED);
        org.junit.jupiter.api.Assertions.assertEquals(AuditActorType.USER, refused.getActorType());
        org.junit.jupiter.api.Assertions.assertEquals(AuditTargetType.ENDPOINT, refused.getTargetType());
        org.junit.jupiter.api.Assertions.assertEquals("GET /users", refused.getTargetLabel());
        org.junit.jupiter.api.Assertions.assertEquals("/users", refused.getMetadata().get("path"));

        // An anonymous request never reaches an authorization rule and has no actor.
        mockMvc.perform(get("/users")).andExpect(status().isUnauthorized());
        org.junit.jupiter.api.Assertions.assertEquals(
                1,
                auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.ACCESS_REFUSED)
                        .count()
        );
    }

    @Test
    void systemStatusReportsUptimeCountsAndTheLastPersistedWrite() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("target@student.kit.edu", false);
        createLecture();

        mockMvc.perform(patch("/users/{id}/block", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/system/status").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Success"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.checkedAt", endsWith("Z")))
                .andExpect(jsonPath("$.startedAt", endsWith("Z")))
                .andExpect(jsonPath("$.uptimeSeconds").isNumber())
                .andExpect(jsonPath("$.database.reachable").value(true))
                .andExpect(jsonPath("$.database.latencyMs").isNumber())
                .andExpect(jsonPath("$.database.error").doesNotExist())
                .andExpect(jsonPath("$.counts.users").value(2))
                .andExpect(jsonPath("$.counts.admins").value(1))
                .andExpect(jsonPath("$.counts.lectures").value(1))
                .andExpect(jsonPath("$.counts.auditEvents").value(1))
                .andExpect(jsonPath("$.counts.openCommentReports").value(0))
                .andExpect(jsonPath("$.lastWrite.action").value("USER_BLOCKED"))
                .andExpect(jsonPath("$.lastWrite.actorName").value("admin"))
                .andExpect(jsonPath("$.lastWrite.at", endsWith("Z")))
                .andExpect(jsonPath("$.lastWrite.ageSeconds").isNumber());

        Session student = createSession("student@student.kit.edu", false);
        mockMvc.perform(get("/system/status").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/system/status")).andExpect(status().isUnauthorized());
    }

    @Test
    void systemStatusWithoutAuditHistoryOmitsTheLastWrite() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);

        mockMvc.perform(get("/system/status").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"))
                .andExpect(jsonPath("$.counts.auditEvents").value(0))
                .andExpect(jsonPath("$.lastWrite").doesNotExist());
    }

    @Test
    void everyUserFieldIsEditableAndLockoutsAreRefused() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("target@student.kit.edu", false);
        String targetToken = issueToken(target.student());

        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"Corrected Name","biography":"Hi","credibilityScore":7}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Updated user successfully"));

        mockMvc.perform(get("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("Corrected Name"))
                .andExpect(jsonPath("$.biography").value("Hi"));

        // Changing the address is a change of login identity, so the sessions have to go.
        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kitEmail\":\"MOVED@student.kit.edu\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/auth/me").header("Authorization", bearer(targetToken)))
                .andExpect(status().isUnauthorized());
        org.junit.jupiter.api.Assertions.assertEquals(
                "moved@student.kit.edu",
                studentRepository.findById(target.student().getId()).orElseThrow().getKitEmail()
        );

        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertTrue(adminRepository
                .findByStudent(studentRepository.findById(target.student().getId()).orElseThrow())
                .isPresent());

        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STUDENT\"}"))
                .andExpect(status().isOk());

        AuditLog updated = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == AuditAction.USER_UPDATED)
                .findFirst()
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(AuditTargetType.USER, updated.getTargetType());
        org.junit.jupiter.api.Assertions.assertTrue(updated.getChanges().containsKey("username"));

        // Refusals: no empty update, no self lockout, no colliding identity, no delete
        // through a field edit.
        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kitEmail\":\"not-kit@example.com\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELETED\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(patch("/users/{id}", admin.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STUDENT\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(patch("/users/{id}", admin.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"BLOCKED\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(patch("/users/{id}", UUID.randomUUID())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"Ghost\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void warningsCanBeRewordedAndWithdrawn() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("warned@student.kit.edu", false);

        mockMvc.perform(post("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Typo in teh reason\"}"))
                .andExpect(status().isOk());
        UUID warningId = warningRepository.findAll().getFirst().getId();

        mockMvc.perform(patch("/users/{id}/warnings/{warningId}",
                        target.student().getId(), warningId)
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Typo in the reason\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.warnings[0].message").value("Typo in the reason"));

        // A warning addressed under the wrong student is a wrong URL.
        mockMvc.perform(delete("/users/{id}/warnings/{warningId}",
                        admin.student().getId(), warningId)
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/users/{id}/warnings/{warningId}",
                        target.student().getId(), warningId)
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        mockMvc.perform(get("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.warnings", hasSize(0)));

        auditOf(AuditAction.USER_WARNING_UPDATED);
        auditOf(AuditAction.USER_WARNING_DELETED);
    }

    @Test
    void commentsAndAnswersAreListedEditableAndDeletable() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session author = createSession("author@student.kit.edu", false);
        Lecture lecture = createLecture();

        Comment comment = new Comment();
        comment.setStudent(author.student());
        comment.setLecture(lecture);
        comment.setContent("Origianl typo");
        comment.setStatus(ContentStatus.VISIBLE);
        comment = commentRepository.saveAndFlush(comment);

        mockMvc.perform(post("/social/answers")
                        .header("Authorization", bearer(author.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"commentID":"%s","content":"An answer"}
                                """.formatted(comment.getId())))
                .andExpect(status().isOk());
        UUID answerId = answerRepository.findAll().getFirst().getId();

        mockMvc.perform(get("/comments").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].content").value("Origianl typo"))
                .andExpect(jsonPath("$.comments[0].postContext").value("CS101 — Algorithms"))
                .andExpect(jsonPath("$.comments[0].author.name").value("author"))
                .andExpect(jsonPath("$.comments[0].answers").value(1))
                .andExpect(jsonPath("$.comments[0].reports").value(0));

        mockMvc.perform(get("/answers").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answers", hasSize(1)))
                .andExpect(jsonPath("$.answers[0].commentPreview").value("Origianl typo"))
                .andExpect(jsonPath("$.answers[0].postContext").value("CS101 — Algorithms"));

        mockMvc.perform(patch("/comments/{id}", comment.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Original text\",\"status\":\"HIDDEN\"}"))
                .andExpect(status().isOk());
        Comment stored = commentRepository.findById(comment.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Original text", stored.getContent());
        org.junit.jupiter.api.Assertions.assertEquals(ContentStatus.HIDDEN, stored.getStatus());

        mockMvc.perform(patch("/answers/{id}", answerId)
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"A better answer\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/comments/{id}", comment.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/comments/{id}", comment.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"   \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/comments/{id}", UUID.randomUUID())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"HIDDEN\"}"))
                .andExpect(status().isNotFound());

        // Deleting the comment takes the thread with it, including the notification the
        // answer raised — which is not cascaded and would dangle.
        mockMvc.perform(delete("/comments/{id}", comment.getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(0, commentRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(0, answerRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(0, notificationRepository.count());

        auditOf(AuditAction.COMMENT_UPDATED);
        auditOf(AuditAction.ANSWER_UPDATED);
        auditOf(AuditAction.COMMENT_DELETED);
    }

    @Test
    void answerReportsCanBeReviewedAndReportsWithdrawn() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session reporter = createSession("reporter@student.kit.edu", false);
        Lecture lecture = createLecture();

        Comment comment = new Comment();
        comment.setStudent(reporter.student());
        comment.setLecture(lecture);
        comment.setContent("Question");
        comment.setStatus(ContentStatus.VISIBLE);
        comment = commentRepository.saveAndFlush(comment);

        mockMvc.perform(post("/social/answers")
                        .header("Authorization", bearer(reporter.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"commentID":"%s","content":"Rude answer"}
                                """.formatted(comment.getId())))
                .andExpect(status().isOk());
        UUID answerId = answerRepository.findAll().getFirst().getId();

        mockMvc.perform(post("/social/answers/report")
                        .header("Authorization", bearer(reporter.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"answerID":"%s","reportReason":"HARASSMENT","explanation":"Rude"}
                                """.formatted(answerId)))
                .andExpect(status().isOk());

        String reported = mockMvc.perform(get("/answers/reported")
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answers", hasSize(1)))
                .andExpect(jsonPath("$.answers[0].answerContent").value("Rude answer"))
                .andExpect(jsonPath("$.answers[0].commentContent").value("Question"))
                .andExpect(jsonPath("$.answers[0].postContext").value("CS101 — Algorithms"))
                .andExpect(jsonPath("$.answers[0].status").value("OPEN"))
                .andReturn().getResponse().getContentAsString();
        String reportId = com.jayway.jsonpath.JsonPath.read(reported, "$.answers[0].id");

        // ACTION_TAKEN is the status that hides the answer, mirroring comment reports.
        mockMvc.perform(patch("/answers/reported/{id}", reportId)
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTION_TAKEN\"}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(
                ContentStatus.HIDDEN,
                answerRepository.findById(answerId).orElseThrow().getStatus()
        );

        mockMvc.perform(patch("/answers/reported/{id}", reportId)
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISMISSED\"}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(
                ContentStatus.VISIBLE,
                answerRepository.findById(answerId).orElseThrow().getStatus()
        );

        // Withdrawing the report leaves the answer alone.
        mockMvc.perform(delete("/answers/reported/{id}", reportId)
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        mockMvc.perform(get("/answers/reported").header("Authorization", bearer(admin.rawToken())))
                .andExpect(jsonPath("$.answers", hasSize(0)));
        org.junit.jupiter.api.Assertions.assertEquals(1, answerRepository.count());

        // Two status changes were made, and each is its own event.
        org.junit.jupiter.api.Assertions.assertEquals(
                2,
                auditLogRepository.findAll().stream()
                        .filter(log -> log.getAction() == AuditAction.ANSWER_REPORT_STATUS_CHANGED)
                        .count()
        );
        auditOf(AuditAction.ANSWER_REPORT_DELETED);
    }

    @Test
    void bugReportTextIsEditableAndReportsAreDeletable() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        BugReport report = new BugReport();
        report.setTitle("asdf");
        report.setDescription("broken");
        report.setSeverity(BugSeverity.LOW);
        report.setReporter(createStudent("reporter@student.kit.edu"));
        report = bugReportRepository.saveAndFlush(report);

        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Profile upload fails","description":"Steps to reproduce"}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(get("/reports").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bugReports[0].title").value("Profile upload fails"))
                .andExpect(jsonPath("$.bugReports[0].description").value("Steps to reproduce"));

        mockMvc.perform(patch("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/reports/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(0, bugReportRepository.count());
        auditOf(AuditAction.BUG_REPORT_DELETED);
    }

    @Test
    void ratingsCanBeDiscarded() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session student = createSession("rater@student.kit.edu", false);
        Lecture lecture = createLecture();

        mockMvc.perform(post("/ratings/rate")
                        .header("Authorization", bearer(student.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lectureId":"%s","topics":[{"category":"ORGANIZATION","value":1}]}
                                """.formatted(lecture.getId())))
                .andExpect(status().isOk());
        UUID ratingId = ratingRepository.findAll().getFirst().getId();

        mockMvc.perform(delete("/ratings/{id}", ratingId)
                        .header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/ratings/{id}", ratingId)
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(0, ratingRepository.count());

        // The public read stays public even though the delete beside it is admin-only.
        mockMvc.perform(get("/ratings/{lectureId}", lecture.getId()))
                .andExpect(status().isOk());
        auditOf(AuditAction.RATING_DELETED);
    }

    @Test
    void ratingsListingIsAdminOnlyAndReturnsTheManagedShape() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session student = createSession("rater@student.kit.edu", false);
        Lecture lecture = createLecture();

        mockMvc.perform(post("/ratings/rate")
                        .header("Authorization", bearer(student.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lectureId":"%s","topics":[{"category":"ORGANIZATION","value":4}]}
                                """.formatted(lecture.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(get("/ratings")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/ratings").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/ratings").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ratings", hasSize(1)))
                .andExpect(jsonPath("$.ratings[0].lectureLabel").value("CS101 — Algorithms"))
                .andExpect(jsonPath("$.ratings[0].lectureId").value(lecture.getId().toString()))
                .andExpect(jsonPath("$.ratings[0].student.name").value("rater"))
                .andExpect(jsonPath("$.ratings[0].topics", hasSize(2)))
                .andExpect(jsonPath("$.ratings[0].topics[0].category").value("ORGANIZATION"))
                .andExpect(jsonPath("$.ratings[0].topics[0].value").value(4.0));
    }

    @Test
    void lecturesAndProfessorsAreEditableAndDeletable() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Lecture lecture = createLecture();
        Professor professor = new Professor();
        professor.setFirstName("Ada");
        professor.setLastName("Lovelase");
        professor = professorRepository.saveAndFlush(professor);

        mockMvc.perform(patch("/data/professor/{id}", professor.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lastName":"Lovelace","lectureIds":["%s"]}
                                """.formatted(lecture.getId())))
                .andExpect(status().isOk());
        mockMvc.perform(get("/data/lectures/{id}", lecture.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lecture.professors", hasSize(1)))
                .andExpect(jsonPath("$.lecture.professors[0].lastName").value("Lovelace"));

        mockMvc.perform(patch("/data/lectures/{id}", lecture.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"CS102","semesterYear":2027,"semesterSeason":"WINTER","active":false}
                                """))
                .andExpect(status().isOk());
        Lecture stored = lectureRepository.findById(lecture.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("CS102", stored.getCode());
        org.junit.jupiter.api.Assertions.assertEquals(2027, stored.getSemesterYear());
        org.junit.jupiter.api.Assertions.assertFalse(stored.isActive());

        mockMvc.perform(patch("/data/lectures/{id}", lecture.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch("/data/lectures/{id}", lecture.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"professorIds\":[\"%s\"]}".formatted(UUID.randomUUID())))
                .andExpect(status().isNotFound());

        // Deleting the professor detaches it; the lecture and its history survive.
        mockMvc.perform(delete("/data/professor/{id}", professor.getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(0, professorRepository.count());
        mockMvc.perform(get("/data/lectures/{id}", lecture.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lecture.professors", hasSize(0)));

        mockMvc.perform(delete("/data/lectures/{id}", lecture.getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertEquals(0, lectureRepository.count());

        auditOf(AuditAction.PROFESSOR_UPDATED);
        auditOf(AuditAction.PROFESSOR_DELETED);
        auditOf(AuditAction.LECTURE_UPDATED);
        auditOf(AuditAction.LECTURE_DELETED);

        // The public catalogue read is untouched by the admin-only write rules.
        mockMvc.perform(get("/data/lectures")).andExpect(status().isOk());
    }

    @Test
    void allLecturesAndAllProfessorsAreAdminOnlyAndIncludeDeactivatedEntries() throws Exception {
        Session student = createSession("student@student.kit.edu", false);
        Session admin = createSession("admin@student.kit.edu", true);

        Lecture inactiveLecture = createLecture();
        inactiveLecture.setCode("CS999");
        inactiveLecture.setActive(false);
        lectureRepository.saveAndFlush(inactiveLecture);

        Professor activeProfessor = new Professor();
        activeProfessor.setFirstName("Ada");
        activeProfessor.setLastName("Lovelace");
        professorRepository.saveAndFlush(activeProfessor);

        Professor inactiveProfessor = new Professor();
        inactiveProfessor.setFirstName("Grace");
        inactiveProfessor.setLastName("Hopper");
        inactiveProfessor.setActive(false);
        professorRepository.saveAndFlush(inactiveProfessor);

        mockMvc.perform(get("/data/lectures/all")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/data/lectures/all").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/data/lectures/all").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lectures", hasSize(1)))
                .andExpect(jsonPath("$.lectures[0].code").value("CS999"))
                .andExpect(jsonPath("$.lectures[0].active").value(false))
                .andExpect(jsonPath("$.lectures[0].lectureType").value("LECTURE_ONLY"));

        mockMvc.perform(get("/data/professor/all")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/data/professor/all").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/data/professor/all").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professors", hasSize(2)))
                .andExpect(jsonPath("$.professors[?(@.lastName == 'Hopper')].active")
                        .value(org.hamcrest.Matchers.hasItem(false)))
                .andExpect(jsonPath("$.professors[?(@.lastName == 'Lovelace')].active")
                        .value(org.hamcrest.Matchers.hasItem(true)));

        // The public catalogue reads stay filtered to active = true.
        mockMvc.perform(get("/data/lectures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lectures", hasSize(0)));
        mockMvc.perform(get("/data/professor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professors", hasSize(1)));
    }

    @Test
    void deletingALectureTakesItsCommentsRatingsAndAnswerRowsWithIt() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session author = createSession("author@student.kit.edu", false);
        Lecture lecture = createLecture();

        Comment comment = new Comment();
        comment.setStudent(author.student());
        comment.setLecture(lecture);
        comment.setContent("Comment");
        comment.setStatus(ContentStatus.VISIBLE);
        comment = commentRepository.saveAndFlush(comment);

        mockMvc.perform(post("/social/answers")
                        .header("Authorization", bearer(author.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"commentID":"%s","content":"Answer"}
                                """.formatted(comment.getId())))
                .andExpect(status().isOk());
        mockMvc.perform(post("/ratings/rate")
                        .header("Authorization", bearer(author.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lectureId":"%s","topics":[{"category":"ORGANIZATION","value":3}]}
                                """.formatted(lecture.getId())))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/data/lectures/{id}", lecture.getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());

        org.junit.jupiter.api.Assertions.assertEquals(0, lectureRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(0, commentRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(0, answerRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(0, ratingRepository.count());
        org.junit.jupiter.api.Assertions.assertEquals(0, notificationRepository.count());

        AuditLog deleted = auditOf(AuditAction.LECTURE_DELETED);
        org.junit.jupiter.api.Assertions.assertEquals(1, deleted.getMetadata().get("deletedComments"));
        org.junit.jupiter.api.Assertions.assertEquals(1, deleted.getMetadata().get("deletedRatings"));
    }

    @Test
    void auditFailureRollsBackDomainMutation() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("rollback@student.kit.edu", false);
        doThrow(new IllegalStateException("audit failure"))
                .when(auditWriter)
                .write(
                        any(),
                        eq(AuditAction.USER_BLOCKED),
                        any(),
                        any(),
                        any(),
                        any(),
                        any()
                );

        mockMvc.perform(patch("/users/{id}/block", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isInternalServerError());
        org.junit.jupiter.api.Assertions.assertEquals(
                UserStatus.ACTIVE,
                studentRepository.findById(target.student().getId()).orElseThrow().getStatus()
        );
    }

    @Test
    void logoutAllRevokesEverySessionOfTheAccount() throws Exception {
        Session first = createSession("multi-device@student.kit.edu", false);
        String secondToken = issueToken(first.student());
        String validateBody = """
                {"email":"multi-device@student.kit.edu"}
                """;

        mockMvc.perform(post("/auth/logout-all")
                        .header("Authorization", bearer(first.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/auth/validate")
                        .header("Authorization", bearer(first.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validateBody))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/auth/validate")
                        .header("Authorization", bearer(secondToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validateBody))
                .andExpect(status().isUnauthorized());

        org.junit.jupiter.api.Assertions.assertEquals(2, tokenRepository.findAll().size());
        org.junit.jupiter.api.Assertions.assertTrue(
                tokenRepository.findAll().stream().allMatch(Token::isRevoked)
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                UserStatus.ACTIVE,
                studentRepository.findById(first.student().getId()).orElseThrow().getStatus()
        );

        requestCode("multi-device@student.kit.edu");
        String freshToken = com.jayway.jsonpath.JsonPath.read(
                mockMvc.perform(post("/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"multi-device@student.kit.edu","loginToken":"%s"}
                                        """.formatted(
                                        codeDelivery.codeFor("multi-device@student.kit.edu"))))
                        .andExpect(status().isOk())
                        .andReturn().getResponse().getContentAsString(),
                "$.authToken"
        );
        mockMvc.perform(get("/auth/me").header("Authorization", bearer(freshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.kitEmail").value("multi-device@student.kit.edu"));
    }

    @Test
    @WithAnonymousUser
    void logoutAllRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/auth/logout-all"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Not logged in"))
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/auth/logout-all").header("Authorization", bearer("bogus-token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Not logged in"));
    }

    @Test
    @WithAnonymousUser
    void healthChecksDatabaseReadiness() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("API healthy"))
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void warningIsDeliveredToTheStudentWithoutRestrictingThem() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("warned@student.kit.edu", false);

        mockMvc.perform(post("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Repeated harassment after prior warning\"}"))
                .andExpect(status().isOk());

        // The student is told, with the reason, through their own feed. The payload
        // key is "answers" for historical reasons; renaming it would break the
        // student app, so the new entries ride along in the same list.
        mockMvc.perform(get("/social/notifications/")
                        .header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answers", hasSize(1)))
                .andExpect(jsonPath("$.answers[0].type").value("WARNING"))
                .andExpect(jsonPath("$.answers[0].message")
                        .value("Repeated harassment after prior warning"));

        // A warning is a disciplinary record, not a restriction: the account keeps
        // its status and the session keeps working.
        org.junit.jupiter.api.Assertions.assertEquals(
                UserStatus.ACTIVE,
                studentRepository.findById(target.student().getId()).orElseThrow().getStatus()
        );
        mockMvc.perform(get("/auth/me").header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.status").value("ACTIVE"));

        // Warnings accumulate and are counted live.
        mockMvc.perform(post("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Second incident\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/users").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users[?(@.kitEmail == 'warned@student.kit.edu')].warnings")
                        .value(org.hamcrest.Matchers.hasItem(2)));
    }

    @Test
    void blockedStudentIsRejectedEvenWithAnUnrevokedToken() throws Exception {
        Session target = createSession("blocked@student.kit.edu", false);

        // Change the status without going through the admin endpoint, so no token
        // is revoked. The filter itself must still reject the session.
        Student student = studentRepository.findById(target.student().getId()).orElseThrow();
        student.setStatus(UserStatus.BLOCKED);
        studentRepository.saveAndFlush(student);

        org.junit.jupiter.api.Assertions.assertTrue(
                tokenRepository.findAll().stream().noneMatch(Token::isRevoked)
        );
        mockMvc.perform(get("/auth/me").header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Not logged in"));

        // A blocked account cannot start a new session either, and its code is not
        // consumed on the way to the rejection.
        mockMvc.perform(post("/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"blocked@student.kit.edu\"}"))
                .andExpect(status().isOk());
        org.junit.jupiter.api.Assertions.assertNull(
                codeDelivery.codeFor("blocked@student.kit.edu")
        );
    }

    @Test
    void actionTakenHidesTheCommentAndRevertingRestoresIt() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Student reported = createStudent("hidden-author@student.kit.edu");
        Student reporter = createStudent("hidden-reporter@student.kit.edu");
        Lecture lecture = createLecture();
        Comment comment = new Comment();
        comment.setContent("Offending content");
        comment.setStudent(reported);
        comment.setLecture(lecture);
        comment = commentRepository.saveAndFlush(comment);
        CommentReport report = new CommentReport();
        report.setComment(comment);
        report.setReporter(reporter);
        report.setReason(ReportReason.HARASSMENT);
        report = commentReportRepository.saveAndFlush(report);

        mockMvc.perform(get("/social/comments/{id}", lecture.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(1)));

        mockMvc.perform(patch("/comments/reported/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTION_TAKEN\"}"))
                .andExpect(status().isOk());

        org.junit.jupiter.api.Assertions.assertEquals(
                ContentStatus.HIDDEN,
                commentRepository.findById(comment.getId()).orElseThrow().getStatus()
        );
        mockMvc.perform(get("/social/comments/{id}", lecture.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(0)));

        AuditLog audit = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == AuditAction.COMMENT_REPORT_STATUS_CHANGED)
                .findFirst()
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(audit.getChanges().containsKey("commentStatus"));

        mockMvc.perform(patch("/comments/reported/{id}", report.getId())
                        .header("Authorization", bearer(admin.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DISMISSED\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/social/comments/{id}", lecture.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(1)));
    }

    @Test
    void deleteAnonymizesTheAccountButKeepsContentAndAuditHistory() throws Exception {
        Session admin = createSession("admin@student.kit.edu", true);
        Session target = createSession("gone@student.kit.edu", false);
        Lecture lecture = createLecture();
        Comment comment = new Comment();
        comment.setContent("Authored before deletion");
        comment.setStudent(target.student());
        comment.setLecture(lecture);
        comment = commentRepository.saveAndFlush(comment);

        mockMvc.perform(delete("/users/{id}", target.student().getId())
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk());

        Student deleted = studentRepository.findById(target.student().getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(UserStatus.DELETED, deleted.getStatus());
        org.junit.jupiter.api.Assertions.assertFalse(deleted.getUsername().contains("gone"));
        org.junit.jupiter.api.Assertions.assertTrue(
                deleted.getKitEmail().endsWith("@invalid.local")
        );
        org.junit.jupiter.api.Assertions.assertNotNull(deleted.getDeletedAt());

        // The content keeps a valid foreign key rather than dangling.
        org.junit.jupiter.api.Assertions.assertTrue(
                commentRepository.findById(comment.getId()).isPresent()
        );

        // The audit row survives and still names who was deleted.
        AuditLog audit = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == AuditAction.USER_DELETED)
                .findFirst()
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(
                audit.getTargetLabel().contains("gone@student.kit.edu")
        );

        mockMvc.perform(get("/auth/me").header("Authorization", bearer(target.rawToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userListPutsAdministratorsFirstThenNewestJoined() throws Exception {
        Session oldStudent = createSession("aaa-old@student.kit.edu", false);
        Session admin = createSession("admin@student.kit.edu", true);
        createSession("zzz-new@student.kit.edu", false);

        Student old = studentRepository.findById(oldStudent.student().getId()).orElseThrow();
        old.setCreatedAt(LocalDateTime.now().minusDays(30));
        studentRepository.saveAndFlush(old);

        mockMvc.perform(get("/users").header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users", hasSize(3)))
                .andExpect(jsonPath("$.users[0].role").value("ADMIN"))
                .andExpect(jsonPath("$.users[1].kitEmail").value("zzz-new@student.kit.edu"))
                .andExpect(jsonPath("$.users[2].kitEmail").value("aaa-old@student.kit.edu"));
    }

    @Test
    void studentsMayLogOutAndMalformedCursorsAreRejectedWithBadRequest() throws Exception {
        Session student = createSession("self-logout@student.kit.edu", false);

        mockMvc.perform(post("/auth/logout").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mockMvc.perform(get("/auth/me").header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isUnauthorized());
        // A student logout is USER_LOGOUT; ADMIN_LOGOUT belongs to the administrative
        // record only.
        AuditLog logout = auditOf(AuditAction.USER_LOGOUT);
        org.junit.jupiter.api.Assertions.assertEquals(AuditActorType.USER, logout.getActorType());
        org.junit.jupiter.api.Assertions.assertEquals(1, auditLogRepository.count());

        Session admin = createSession("admin@student.kit.edu", true);
        String badTimestamp = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("1|not-a-timestamp|" + UUID.randomUUID())
                        .getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(admin.rawToken()))
                        .param("cursor", badTimestamp))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid audit cursor"));
    }

    @Test
    void replayedRefusalsAgainstABlockedAccountCannotFillTheActivityLog() throws Exception {
        Student blocked = createStudent("blocked@student.kit.edu");
        blocked.setStatus(UserStatus.BLOCKED);
        studentRepository.saveAndFlush(blocked);

        // The status refusal has to consume the failure budget, otherwise the gate never
        // closes and every replay of a known address writes another record.
        for (int attempt = 0; attempt < 25; attempt++) {
            mockMvc.perform(post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email":"blocked@student.kit.edu","loginToken":"ABC234"}
                            """));
        }

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"blocked@student.kit.edu","loginToken":"ABC234"}
                                """))
                .andExpect(status().isTooManyRequests());

        long refusals = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == AuditAction.LOGIN_REFUSED)
                .count();
        org.junit.jupiter.api.Assertions.assertEquals(
                10,
                refusals,
                "login refusals must stop at the per-email failure limit"
        );
    }

    @Test
    void demotingAnAdministratorWithModerationHistoryIsRefused() throws Exception {
        Session acting = createSession("admin@student.kit.edu", true);
        Session other = createSession("other@student.kit.edu", true);
        Session target = createSession("target@student.kit.edu", false);

        // The admin being demoted has already issued a warning, which points at its
        // admin row with a non-null foreign key.
        mockMvc.perform(post("/users/{id}/warnings", target.student().getId())
                        .header("Authorization", bearer(other.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Be nice\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/users/{id}", other.student().getId())
                        .header("Authorization", bearer(acting.rawToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"STUDENT\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("Administrator has moderation history and cannot be demoted"));

        org.junit.jupiter.api.Assertions.assertTrue(
                adminRepository.findByStudent(other.student()).isPresent(),
                "the admin row must survive a refused demotion"
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                1,
                warningRepository.count(),
                "the warning must survive a refused demotion"
        );
    }


    @Test
    void auditWriterCoversAdminRefusalAndNullPayloadBranches() {
        Session admin = createSession("coverage-admin@student.kit.edu", true);
        Session student = createSession("coverage-student@student.kit.edu", false);

        AuditLog adminRefusal = auditWriter.writeRefusal(
                admin.student(),
                true,
                AuditAction.ACCESS_REFUSED,
                AuditTargetType.ENDPOINT,
                null,
                "PATCH /users/{id}/block",
                Map.of("path", "/users/coverage/block")
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                AuditActorType.ADMIN, adminRefusal.getActorType());
        org.junit.jupiter.api.Assertions.assertEquals(
                "ADMIN", adminRefusal.getActorRole());

        AuditLog studentRefusal = auditWriter.writeRefusal(
                student.student(),
                false,
                AuditAction.ACCESS_REFUSED,
                AuditTargetType.ENDPOINT,
                null,
                "GET /users",
                Map.of("path", "/users")
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                AuditActorType.USER, studentRefusal.getActorType());
        org.junit.jupiter.api.Assertions.assertEquals(
                "STUDENT", studentRefusal.getActorRole());

        AuditLog nullPayloads = auditWriter.write(
                admin.admin(),
                AuditAction.USER_BLOCKED,
                AuditTargetType.USER,
                student.student().getId(),
                "coverage-student",
                null,
                null
        );
        org.junit.jupiter.api.Assertions.assertTrue(
                nullPayloads.getChanges().isEmpty());
        org.junit.jupiter.api.Assertions.assertTrue(
                nullPayloads.getMetadata().isEmpty());
    }






    private void requestCode(String email) throws Exception {
        mockMvc.perform(post("/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login code sent"));
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

    private String issueToken(Student student) {
        String raw = TokenGenerator.generateToken();
        Token token = new Token();
        token.setEmail(student.getKitEmail());
        token.setStudent(student);
        token.setHash(HashGenerator.hashToken(raw));
        token.setExpiresAt(LocalDateTime.now().plusHours(12));
        tokenRepository.saveAndFlush(token);
        return raw;
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

    private Lecture createLecture() {
        Lecture lecture = new Lecture();
        lecture.setName("Algorithms");
        lecture.setCode("CS101");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SUMMER);
        lecture.setActive(true);
        return lectureRepository.saveAndFlush(lecture);
    }

    private void saveAudit(Session admin, UUID id, Instant createdAt) {
        AuditLog log = new AuditLog();
        log.setId(id);
        log.setAction(AuditAction.USER_BLOCKED);
        log.setCreatedAt(createdAt);
        log.setActorType(AuditActorType.ADMIN);
        log.setActorId(admin.student().getId());
        log.setActorName(admin.student().getUsername());
        log.setActorEmail(admin.student().getKitEmail());
        log.setActorRole("ADMIN");
        log.setTargetType(AuditTargetType.USER);
        log.setTargetId(UUID.randomUUID());
        log.setTargetLabel("Target (target@student.kit.edu)");
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("before", "ACTIVE");
        status.put("after", "BLOCKED");
        log.setChanges(Map.of("status", status));
        log.setMetadata(Map.of());
        auditLogRepository.saveAndFlush(log);
    }

    /** The single recorded event with this action, failing when there is not exactly one. */
    private AuditLog auditOf(AuditAction action) {
        java.util.List<AuditLog> matches = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == action)
                .toList();
        org.junit.jupiter.api.Assertions.assertEquals(1, matches.size(), action + " entries");
        return matches.getFirst();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Session(Student student, Admin admin, Token token, String rawToken) {
    }
}
