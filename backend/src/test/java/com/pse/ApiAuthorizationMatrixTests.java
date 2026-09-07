package com.pse;

import com.jayway.jsonpath.JsonPath;
import com.pse.audit.repository.AuditLogRepository;
import com.pse.auth.repository.AuthRateLimitBucketRepository;
import com.pse.auth.repository.OneTimePasswordRepository;
import com.pse.auth.repository.TokenRepository;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.BugReportRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.repository.RatingRepository;
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
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The authorization matrix, asserted against the routes the application actually
 * publishes rather than against a list kept by hand.
 *
 * <p>Why it is shaped this way: the security chain ends in
 * {@code anyRequest().permitAll()}, so an endpoint is anonymous unless some matcher names
 * it. That makes "no rule matched" indistinguishable from "deliberately public" by
 * reading {@code SecurityConfig} alone, and a new controller method inherits the open
 * default silently. {@link #everyRouteIsEitherDeclaredPublicOrRefusesAnonymousCallers()}
 * closes that: it walks Spring's own handler mappings, so a route added later has to be
 * either refused for anonymous callers or written into {@link #PUBLIC_ROUTES} by someone
 * who thought about it.
 *
 * <p>{@link AdminApiPathSplitTests} covers the admin tier by role; this class covers the
 * anonymous boundary across every tier and the {@code authenticated()} tier, which had no
 * role coverage at all.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestDeliveryConfig.class, com.pse.support.TestGitLabConfig.class})
class ApiAuthorizationMatrixTests {

    /**
     * Every route reachable without an Authorization header, as {@code "VERB /path"} using
     * the mapping's own pattern. Anything not listed here must answer 401 anonymously.
     *
     * <p>Deliberately absent, and worth saying why, because all three look public:
     * {@code POST /auth/validate} and {@code POST /reports} are matched by
     * {@code permitAll} but read the header by hand and answer 401 without one;
     * {@code POST /data/professor} was open by accident until the chain was given a rule
     * for it.
     */
    private static final Set<String> PUBLIC_ROUTES = Set.of(
            "POST /auth/request-login",
            "POST /auth/login",
            "POST /admin/auth/request-login",
            "POST /admin/auth/login",
            "GET /health",
            "GET /data/lectures",
            "GET /data/lectures/{lecture_id}",
            "GET /data/professor",
            "GET /data/professor/{professor_id}",
            "GET /data/professor/id",
            "GET /ratings/{lectureId}",
            "GET /ratings/{lectureId}/categories",
            "GET /social/comments/{lecture_id}",
            "GET /social/sync/comments"
    );

    private static final String STUDENT_EMAIL = "matrix-student@student.kit.edu";

    @Autowired MockMvc mockMvc;
    @Autowired CapturingLoginCodeDelivery codeDelivery;
    @Autowired RequestMappingHandlerMapping handlerMapping;

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

    /**
     * The load-bearing test. Walks every route the application publishes and requires each
     * one to be either declared public or refused with a 401 for an anonymous caller.
     *
     * <p>A failure here is not necessarily a bug in the new route -- it is a question
     * nobody has answered yet: is this endpoint meant to be public? Answer it by adding a
     * matcher to {@code SecurityConfig} or a line to {@link #PUBLIC_ROUTES}.
     */
    @Test
    void everyRouteIsEitherDeclaredPublicOrRefusesAnonymousCallers() throws Exception {
        List<String> open = new ArrayList<>();
        List<String> unexpected = new ArrayList<>();

        Set<String> routes = applicationRoutes();

        // A sweep that enumerated nothing would pass every assertion below it. 122 routes
        // are mapped today; the floor is here so this test cannot go quiet if the handler
        // mapping stops resolving.
        assertTrue(routes.size() >= 100,
                "expected the whole API surface, found only " + routes.size() + " routes");

        for (String route : new TreeSet<>(routes)) {
            if (PUBLIC_ROUTES.contains(route)) {
                continue;
            }
            int status = anonymousStatusOf(route);
            if (status != 401) {
                (status == 403 ? unexpected : open).add(route + " -> " + status);
            }
        }

        // 403 is the authenticated-but-unauthorized answer; an anonymous caller should not
        // be able to provoke it, and if one can, the entry point is being bypassed.
        assertTrue(unexpected.isEmpty(), "anonymous callers were answered 403, not 401: " + unexpected);
        assertTrue(open.isEmpty(),
                "these routes answered an anonymous caller without refusing it. Either give "
                        + "SecurityConfig a matcher for them or add them to PUBLIC_ROUTES: " + open);
    }

    /** The other direction: the routes declared public have to stay reachable. */
    @Test
    void declaredPublicRoutesAreReachableWithoutAToken() throws Exception {
        Set<String> routes = applicationRoutes();

        for (String route : new TreeSet<>(PUBLIC_ROUTES)) {
            assertTrue(routes.contains(route),
                    route + " is declared public but is not a route any more -- remove it from "
                            + "PUBLIC_ROUTES, or fix the pattern");

            int status = anonymousStatusOf(route);
            assertTrue(status != 401 && status != 403,
                    route + " is declared public but answered " + status + " without a token");

            // No exemptions left. This list held two entries until F-14 and F-15 were
            // fixed -- GET /data/professor/id with no query parameters, and
            // GET /ratings/{lectureId}/categories for an unknown lecture -- both reachable
            // by an anonymous caller with no fixture at all. A public route answering 5xx
            // is now a plain failure.
            assertTrue(status < 500, route + " is public but answered " + status);
        }
    }

    /**
     * {@code POST /reports} is the student's bug submission and stays open in the chain, so
     * it reads the header itself. With no header at all it used to answer 500: the
     * {@code InvalidAuthTokenException} thrown by {@code AuthService.verifyUser} had no
     * handler and fell through to the catch-all. The documented contract is 401.
     */
    @Test
    void bugSubmissionWithoutAnAuthorizationHeaderIsUnauthorizedRatherThanAServerError()
            throws Exception {
        mockMvc.perform(post("/reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"No token","description":"Filed with no header","severity":"LOW"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Not logged in"));

        assertEquals(0, bugReportRepository.count());
    }

    /**
     * The legacy catalogue create used to answer a non-admin {@code 200 {"success":false}}
     * from inside the handler, which is a refusal the panel could not tell from a
     * validation failure. It is the security chain's now, like its {@code /admin} twin.
     */
    @Test
    void legacyProfessorCreateRefusesAStudentWithForbidden() throws Exception {
        String studentToken = studentSession();

        mockMvc.perform(post("/data/professor")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Stefan","lastName":"Kuehnlein","lectureIDs":[]}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Could not authenticate Admin"));

        assertEquals(0, professorRepository.count());
    }

    /** The authenticated tier from the other side: a student session is let through. */
    @Test
    void studentSessionReachesTheEndpointsTheAppNeeds() throws Exception {
        String token = studentSession();

        // Reads only. logout, logout-all and deleteAccount are left out on purpose: they
        // would end the session under the rest of the loop.
        List<String> routes = List.of(
                "GET /auth/me",
                "GET /account/information",
                "GET /account/ratings",
                "GET /social/notifications"
        );

        for (String route : routes) {
            int status = statusOf(route, token);
            assertTrue(status != 401 && status != 403,
                    route + " refused a student session with " + status);
        }
    }

    /**
     * There is no {@code @EnableMethodSecurity} in this application, so {@code @PreAuthorize}
     * and friends are inert: an endpoint carrying one would read as guarded and be open.
     * Authorization lives in {@code SecurityConfig}. This fails if one is added anyway.
     */
    @Test
    void noHandlerReliesOnInertMethodLevelSecurityAnnotations() {
        List<Class<? extends Annotation>> annotations =
                List.of(PreAuthorize.class, PostAuthorize.class, Secured.class);
        List<String> offenders = new ArrayList<>();

        handlerMapping.getHandlerMethods().forEach((info, handler) -> {
            if (!handler.getBeanType().getPackageName().startsWith("com.pse")) {
                return;
            }
            for (Class<? extends Annotation> annotation : annotations) {
                if (handler.getMethod().isAnnotationPresent(annotation)
                        || handler.getBeanType().isAnnotationPresent(annotation)) {
                    offenders.add(handler.getBeanType().getSimpleName() + "."
                            + handler.getMethod().getName() + " carries @"
                            + annotation.getSimpleName());
                }
            }
        });

        assertTrue(offenders.isEmpty(),
                "method security is not enabled, so these annotations do nothing. Move the rule "
                        + "into SecurityConfig, or enable method security deliberately: " + offenders);
    }

    /** Every {@code "VERB /pattern"} this application publishes, from Spring's own mappings. */
    private Set<String> applicationRoutes() {
        Set<String> routes = new TreeSet<>();

        handlerMapping.getHandlerMethods().forEach((info, handler) -> {
            if (!handler.getBeanType().getPackageName().startsWith("com.pse")) {
                return;
            }
            for (String pattern : info.getPatternValues()) {
                for (var method : info.getMethodsCondition().getMethods()) {
                    routes.add(method.name() + " " + pattern);
                }
            }
        });

        return routes;
    }

    private int anonymousStatusOf(String route) throws Exception {
        return statusOf(route, null);
    }

    private int statusOf(String route, String rawToken) throws Exception {
        String verb = route.substring(0, route.indexOf(' '));
        String path = route.substring(route.indexOf(' ') + 1)
                // Any id will do: authorization is decided before the handler looks one up.
                .replaceAll("\\{[^}]+}", UUID.randomUUID().toString());

        MockHttpServletRequestBuilder request = switch (verb) {
            case "GET" -> get(path);
            case "POST" -> post(path);
            case "PATCH" -> patch(path);
            case "DELETE" -> delete(path);
            default -> throw new IllegalArgumentException("unhandled verb in " + route);
        };

        if (!"GET".equals(verb)) {
            request = request.contentType(MediaType.APPLICATION_JSON).content("{}");
        }
        if (rawToken != null) {
            request = request.header("Authorization", "Bearer " + rawToken);
        }

        return mockMvc.perform(request).andReturn().getResponse().getStatus();
    }

    /** A real app session through the real login endpoints, so the session type is right. */
    private String studentSession() throws Exception {
        mockMvc.perform(post("/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(STUDENT_EMAIL)))
                .andExpect(status().isOk());

        String body = mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"loginToken\":\"%s\"}"
                                .formatted(STUDENT_EMAIL, codeDelivery.codeFor(STUDENT_EMAIL))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(body, "$.authToken");
    }
}
