package com.pse;

import com.pse.audit.model.AuditAction;
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
import com.pse.shared.enums.BugSeverity;
import com.pse.shared.enums.ReportReason;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.util.HashGenerator;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentReport;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
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
    @Autowired LectureRepository lectureRepository;
    @Autowired BugReportRepository bugReportRepository;
    @Autowired AuditLogRepository auditLogRepository;
    @MockitoSpyBean AuditWriter auditWriter;

    @BeforeEach
    void cleanDatabase() {
        auditLogRepository.deleteAll();
        warningRepository.deleteAll();
        commentReportRepository.deleteAll();
        commentRepository.deleteAll();
        bugReportRepository.deleteAll();
        tokenRepository.deleteAll();
        otpRepository.deleteAll();
        rateLimitRepository.deleteAll();
        adminRepository.deleteAll();
        lectureRepository.deleteAll();
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
                        .param("from", "2026-07-24T00:00:00.000Z")
                        .param("to", "2026-07-23T00:00:00.000Z"))
                .andExpect(status().isBadRequest());

        admin.student().setUsername("renamed-admin");
        studentRepository.saveAndFlush(admin.student());
        mockMvc.perform(get("/audit-logs/meta")
                        .header("Authorization", bearer(admin.rawToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actors[0].name").value("admin"))
                .andExpect(jsonPath("$.actions", hasSize(8)))
                .andExpect(jsonPath("$.targetTypes", hasSize(4)));

        Session student = createSession("audit-student@student.kit.edu", false);
        mockMvc.perform(get("/audit-logs")
                        .header("Authorization", bearer(student.rawToken())))
                .andExpect(status().isForbidden());
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

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record Session(Student student, Admin admin, Token token, String rawToken) {
    }
}
