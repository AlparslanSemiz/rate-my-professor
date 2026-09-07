package com.pse;

import com.jayway.jsonpath.JsonPath;
import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditLog;
import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.model.SessionType;
import com.pse.auth.model.Token;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.repository.RatingRepository;
import com.pse.shared.util.HashGenerator;
import com.pse.social.repository.AnswerReportRepository;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.repository.AnswerVoteRepository;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.CommentRepository;
import com.pse.social.repository.NotificationRepository;
import com.pse.support.TestDeliveryConfig;
import com.pse.support.TestDeliveryConfig.CapturingLoginCodeDelivery;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The admin panel and the app are two APIs. {@code /admin/auth/login} mints an
 * administrator session on the admin schedule and serves administrators only;
 * {@code /auth/login} mints an app session that lasts a year for everyone, an
 * administrator logging in from their phone included. Which endpoint was called decides
 * both, not which account called it -- deriving it from the account is what used to put an
 * administrator's app on the panel's expiry schedule.
 *
 * <p>Sessions here are always minted through the real login endpoints. The helper in
 * {@link AdminApiIntegrationTests} writes tokens with no session type at all, so tests
 * built on it exercise the legacy branch and would stay green with the admin session path
 * broken.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestDeliveryConfig.class, com.pse.support.TestGitLabConfig.class})
class AdminApiPathSplitTests {

    /** Matches app.auth.admin-bootstrap-emails in application-test.properties. */
    private static final String ADMIN_EMAIL = "admin@student.kit.edu";
    private static final String STUDENT_EMAIL = "split-student@student.kit.edu";

    /** Every path the panel reaches through the new prefix, all of them plain listings. */
    private static final List<String> ADMIN_PATHS = List.of(
            "/admin/users",
            "/admin/audit-logs",
            "/admin/audit-logs/meta",
            "/admin/activity-logs",
            "/admin/activity-logs/meta",
            "/admin/system/status",
            "/admin/comments",
            "/admin/comments/reported",
            "/admin/answers",
            "/admin/answers/reported",
            "/admin/ratings",
            "/admin/reports",
            "/admin/data/lectures/all",
            "/admin/data/professor/all"
    );

    @Autowired MockMvc mockMvc;
    @Autowired CapturingLoginCodeDelivery codeDelivery;
    @Autowired StudentRepository studentRepository;
    @Autowired AdminRepository adminRepository;
    @Autowired TokenRepository tokenRepository;
    @Autowired OneTimePasswordRepository otpRepository;
    @Autowired AuthRateLimitBucketRepository rateLimitRepository;
    @Autowired AuditLogRepository auditLogRepository;
    @Autowired BugReportRepository bugReportRepository;
    @Autowired WarningRepository warningRepository;
    @Autowired CommentRepository commentRepository;
    @Autowired CommentReportRepository commentReportRepository;
    @Autowired NotificationRepository notificationRepository;
    @Autowired AnswerRepository answerRepository;
    @Autowired AnswerReportRepository answerReportRepository;
    @Autowired AnswerVoteRepository answerVoteRepository;
    @Autowired RatingRepository ratingRepository;
    @Autowired LectureRepository lectureRepository;
    @Autowired ProfessorRepository professorRepository;

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
    }

    @Test
    void adminApiLoginIssuesAdminSessionWithTheAdminTtl() throws Exception {
        String response = loginThrough("/admin/auth", ADMIN_EMAIL, "");
        String rawToken = JsonPath.read(response, "$.authToken");

        Token token = tokenOf(rawToken);
        assertEquals(SessionType.ADMIN, token.getSessionType());
        assertLifetimeIsAbout(token, Duration.ofDays(1));
        assertNotNull(JsonPath.read(response, "$.expiresAt"));

        mockMvc.perform(get("/admin/auth/me").header("Authorization", bearer(rawToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.kitEmail").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
        mockMvc.perform(get("/admin/users").header("Authorization", bearer(rawToken)))
                .andExpect(status().isOk());
        assertEquals(1, countAudits(AuditAction.ADMIN_LOGIN));
    }

    @Test
    void adminApiLoginRefusesNonAdminAccount() throws Exception {
        // The account has to exist first. A refusal rolls the whole login back, the account
        // creation included, and an attempt by an address the server has never seen is
        // deliberately left unaudited.
        loginThrough("/auth", STUDENT_EMAIL, "");
        requestCode("/admin/auth/request-login", STUDENT_EMAIL);

        mockMvc.perform(post("/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(STUDENT_EMAIL, "")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Admin access required"))
                .andExpect(jsonPath("$.success").value(false));

        assertEquals(1, tokenRepository.findByEmail(STUDENT_EMAIL).size(), "no admin session was minted");
        AuditLog refusal = auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == AuditAction.LOGIN_REFUSED)
                .findFirst()
                .orElseThrow();
        assertEquals("NOT_AN_ADMIN", refusal.getMetadata().get("reason"));
    }

    @Test
    void adminApiLoginIgnoresRequestedSessionType() throws Exception {
        String response = loginThrough("/admin/auth", ADMIN_EMAIL, ",\"sessionType\":\"APP\"");

        Token token = tokenOf(JsonPath.read(response, "$.authToken"));
        assertEquals(SessionType.ADMIN, token.getSessionType());
        assertLifetimeIsAbout(token, Duration.ofDays(1));
    }

    @Test
    void adminApiRequestLoginDoesNotRevealAdminMembership() throws Exception {
        requestCode("/admin/auth/request-login", STUDENT_EMAIL);
        requestCode("/admin/auth/request-login", ADMIN_EMAIL);
    }

    @Test
    void appLoginKeepsYearLongSessionForAnAdminAccount() throws Exception {
        // The regression this split exists for: an administrator logging in from the app
        // used to inherit the admin lifetime, which is now one day.
        String response = loginThrough("/auth", ADMIN_EMAIL, "");

        Token token = tokenOf(JsonPath.read(response, "$.authToken"));
        assertLifetimeIsAbout(token, Duration.ofDays(365));
    }

    @Test
    void legacyAppLoginStillGivesThePanelAnAdminSession() throws Exception {
        // Until the panel moves to /admin/auth/login it logs in here and sends no session
        // type. It has to keep getting an admin session out of it.
        String rawToken = JsonPath.read(loginThrough("/auth", ADMIN_EMAIL, ""), "$.authToken");

        assertEquals(SessionType.ADMIN, tokenOf(rawToken).getSessionType());
        mockMvc.perform(get("/users").header("Authorization", bearer(rawToken)))
                .andExpect(status().isOk());
    }

    @Test
    void adminPrefixedPathsMatchLegacyAuthorization() throws Exception {
        String adminToken = JsonPath.read(loginThrough("/admin/auth", ADMIN_EMAIL, ""), "$.authToken");
        String studentToken = JsonPath.read(loginThrough("/auth", STUDENT_EMAIL, ""), "$.authToken");

        for (String path : ADMIN_PATHS) {
            assertEquals(200, statusOf(path, adminToken), path + " with an admin session");
            assertEquals(403, statusOf(path, studentToken), path + " with a student session");
            assertEquals(401, statusOf(path, null), path + " without a token");
        }
    }

    /**
     * The same matrix for the writes, which the listing matrix above cannot reach.
     *
     * <p>It matters more here than for the reads. The {@code /admin} prefix is guarded by
     * one blanket rule, but every legacy twin is an individual per-verb matcher, and the
     * chain ends in {@code anyRequest().permitAll()} -- so a verb missing from one of those
     * dozen rules does not deny, it opens. {@code POST /data/professor} is the precedent:
     * it had no matcher at all and was answered inside the handler instead.
     *
     * <p>The admin expectation is "not refused" rather than 200 deliberately. These ids do
     * not exist, so a permitted call lands on a 400 or a 404; that it got that far is the
     * assertion.
     */
    @Test
    void adminWriteVerbsAreRefusedByRoleOnBothPrefixes() throws Exception {
        String adminToken = JsonPath.read(loginThrough("/admin/auth", ADMIN_EMAIL, ""), "$.authToken");
        String studentToken = JsonPath.read(loginThrough("/auth", STUDENT_EMAIL, ""), "$.authToken");

        for (Route route : writeRoutes()) {
            String label = route.method() + " " + route.path();

            assertEquals(401, statusOf(route, null), label + " without a token");
            assertEquals(403, statusOf(route, studentToken), label + " with a student session");

            int admin = statusOf(route, adminToken);
            assertTrue(admin != 401 && admin != 403,
                    label + " refused an admin session with " + admin);
        }
    }

    private record Route(String method, String path) {
    }

    /** Every administrative write, under the /admin prefix and under its legacy twin. */
    private List<Route> writeRoutes() {
        String id = UUID.randomUUID().toString();
        List<Route> routes = new ArrayList<>();

        for (String prefix : List.of("/admin", "")) {
            routes.add(new Route("PATCH", prefix + "/users/" + id));
            routes.add(new Route("DELETE", prefix + "/users/" + id));
            routes.add(new Route("PATCH", prefix + "/users/" + id + "/block"));
            routes.add(new Route("PATCH", prefix + "/users/" + id + "/unblock"));
            routes.add(new Route("POST", prefix + "/users/" + id + "/warnings"));
            routes.add(new Route("PATCH", prefix + "/users/" + id + "/warnings/" + id));
            routes.add(new Route("DELETE", prefix + "/users/" + id + "/warnings/" + id));
            routes.add(new Route("PATCH", prefix + "/comments/" + id));
            routes.add(new Route("DELETE", prefix + "/comments/" + id));
            routes.add(new Route("PATCH", prefix + "/comments/reported/" + id));
            routes.add(new Route("DELETE", prefix + "/comments/reported/" + id));
            routes.add(new Route("PATCH", prefix + "/answers/" + id));
            routes.add(new Route("DELETE", prefix + "/answers/" + id));
            routes.add(new Route("PATCH", prefix + "/answers/reported/" + id));
            routes.add(new Route("DELETE", prefix + "/answers/reported/" + id));
            routes.add(new Route("DELETE", prefix + "/ratings/" + id));
            routes.add(new Route("POST", prefix + "/data/lectures"));
            routes.add(new Route("PATCH", prefix + "/data/lectures/" + id));
            routes.add(new Route("DELETE", prefix + "/data/lectures/" + id));
            routes.add(new Route("POST", prefix + "/data/professor"));
            routes.add(new Route("PATCH", prefix + "/data/professor/" + id));
            routes.add(new Route("DELETE", prefix + "/data/professor/" + id));
            routes.add(new Route("PATCH", prefix + "/reports/" + id));
            routes.add(new Route("DELETE", prefix + "/reports/" + id));
            routes.add(new Route("POST", prefix + "/reports/" + id + "/gitlab-issue"));
            routes.add(new Route("POST", prefix + "/audit-logs/" + id + "/revert"));
        }

        return routes;
    }

    private int statusOf(Route route, String rawToken) throws Exception {
        MockHttpServletRequestBuilder request = switch (route.method()) {
            case "POST" -> post(route.path());
            case "PATCH" -> patch(route.path());
            case "DELETE" -> delete(route.path());
            default -> throw new IllegalArgumentException("unhandled verb " + route.method());
        };

        request = request.contentType(MediaType.APPLICATION_JSON).content("{}");
        if (rawToken != null) {
            request = request.header("Authorization", bearer(rawToken));
        }

        return mockMvc.perform(request).andReturn().getResponse().getStatus();
    }

    @Test
    void adminPrefixDoesNotCaptureAdminsValidate() throws Exception {
        // /admin/** matches whole segments, so the older /admins/** route is untouched by it.
        String rawToken = JsonPath.read(loginThrough("/admin/auth", ADMIN_EMAIL, ""), "$.authToken");

        mockMvc.perform(get("/admins/validate").header("Authorization", bearer(rawToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Is Admin"));
    }

    @Test
    void studentBugSubmissionHasNoAdminTwin() throws Exception {
        String studentToken = JsonPath.read(loginThrough("/auth", STUDENT_EMAIL, ""), "$.authToken");
        String adminToken = JsonPath.read(loginThrough("/admin/auth", ADMIN_EMAIL, ""), "$.authToken");
        String report = """
                {"title":"Broken filter","description":"The listing does not filter","severity":"LOW"}
                """;

        mockMvc.perform(post("/reports")
                        .header("Authorization", bearer(studentToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(report))
                .andExpect(status().isOk());
        mockMvc.perform(post("/admin/reports")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(report))
                .andExpect(status().isNotFound());

        assertEquals(1, bugReportRepository.count());
    }

    @Test
    void adminApiLogoutRevokesAndWritesAdminLogout() throws Exception {
        String rawToken = JsonPath.read(loginThrough("/admin/auth", ADMIN_EMAIL, ""), "$.authToken");

        mockMvc.perform(post("/admin/auth/logout").header("Authorization", bearer(rawToken)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/admin/users").header("Authorization", bearer(rawToken)))
                .andExpect(status().isUnauthorized());
        assertEquals(1, countAudits(AuditAction.ADMIN_LOGOUT));
    }

    @Test
    void loginRateLimitBucketsAreSharedBetweenBothApis() throws Exception {
        // One address, one mailbox, one budget. Two buckets would hand out six codes.
        requestCode("/auth/request-login", ADMIN_EMAIL);
        requestCode("/auth/request-login", ADMIN_EMAIL);
        requestCode("/auth/request-login", ADMIN_EMAIL);

        mockMvc.perform(post("/admin/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(ADMIN_EMAIL)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    private int statusOf(String path, String rawToken) throws Exception {
        var request = get(path);
        if (rawToken != null) {
            request = request.header("Authorization", bearer(rawToken));
        }
        return mockMvc.perform(request).andReturn().getResponse().getStatus();
    }

    private String loginThrough(String api, String email, String extraFields) throws Exception {
        requestCode(api + "/request-login", email);
        return mockMvc.perform(post(api + "/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(email, extraFields)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse().getContentAsString();
    }

    private void requestCode(String path, String email) throws Exception {
        mockMvc.perform(post(path)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login code sent"));
    }

    private String loginBody(String email, String extraFields) {
        return "{\"email\":\"%s\",\"loginToken\":\"%s\"%s}"
                .formatted(email, codeDelivery.codeFor(email), extraFields);
    }

    private Token tokenOf(String rawToken) {
        return tokenRepository
                .findByHashAndRevokedFalseAndExpiresAtAfter(
                        HashGenerator.hashToken(rawToken),
                        LocalDateTime.now(Clock.systemUTC())
                )
                .orElseThrow();
    }

    private void assertLifetimeIsAbout(Token token, Duration expected) {
        long remaining = Duration
                .between(LocalDateTime.now(Clock.systemUTC()), token.getExpiresAt())
                .toSeconds();
        assertTrue(
                remaining <= expected.toSeconds() && remaining >= expected.minusSeconds(30).toSeconds(),
                "expected about " + expected + " of lifetime, " + remaining + " seconds remain"
        );
    }

    private long countAudits(AuditAction action) {
        return auditLogRepository.findAll().stream()
                .filter(log -> log.getAction() == action)
                .count();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
