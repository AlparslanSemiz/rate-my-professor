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
import com.pse.support.ApiContract;
import com.pse.support.TestDeliveryConfig;
import com.pse.support.TestDeliveryConfig.CapturingLoginCodeDelivery;
import com.pse.user.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The protocol layer, swept across the whole API: what every route answers when it is
 * called with a verb it does not map, and when it is handed a body in a media type it
 * cannot read.
 *
 * <p>Both answers come from {@code GlobalExceptionHandler} rather than from any
 * controller, so they are the same on all 122 routes and belong in one class instead of
 * being repeated per controller. Both are currently wrong, and both are therefore
 * asserted as pins through the two constants below -- change the constant, not 122
 * assertions, when the handler is fixed.
 *
 * <p>Every probe carries an administrator session. The security chain runs before the
 * dispatcher, and many of its matchers are per-verb, so an anonymous probe would be
 * answered 401 by the entry point and never reach the code under test here. An admin
 * token satisfies both {@code hasRole("ADMIN")} and {@code authenticated()}, so it is the
 * one session that reaches the dispatcher on every route.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import({TestDeliveryConfig.class, com.pse.support.TestGitLabConfig.class})
class ApiProtocolContractTests {

    /**
     * A path that exists, called with a verb it does not map -- F-16.
     *
     * <p>The correct answer is 405 with an {@code Allow} header.
     * {@code GlobalExceptionHandler.handleWrongMethod} answers <b>404 "Not found"</b>
     * instead, with a body copied verbatim from the {@code NoResourceFoundException}
     * handler directly above it. The behaviour is pinned rather than corrected because
     * fixing it is a contract change with a documented dependent: {@code docs/admin-api.md}
     * states that {@code POST /admin/reports} answers 404, and that 404 is produced by
     * this very mapping.
     *
     * <p>Held in {@link ApiContract} because {@link AdminApiPathSplitTests} depends on it
     * too. When the handler is fixed, that constant becomes 405 and
     * {@link #wrongVerbCarriesTheProjectErrorBody()} needs an {@code Allow} assertion.
     */
    private static final int WRONG_VERB_STATUS = ApiContract.WRONG_VERB_STATUS;

    /**
     * A body in a media type the handler cannot read -- F-17, fixed.
     *
     * <p>{@code GlobalExceptionHandler.handleUnsupportedMediaType} now answers 415 with the
     * project's {@code BasicResponse} body. Before it existed,
     * {@code @ExceptionHandler(Exception.class)} claimed
     * {@code HttpMediaTypeNotSupportedException} before Spring's own resolver could answer
     * 415, and all 37 body-reading routes told the caller the backend broke.
     *
     * <p>The fix is one narrow {@code @ExceptionHandler}. Extending
     * {@code ResponseEntityExceptionHandler} was <b>not</b> the fix -- it maps this type
     * together with F-16's and F-14's, clashes with {@code handleWrongMethod}, and returns
     * {@code ProblemDetail} instead of {@code BasicResponse}. See the finding.
     */
    private static final int UNSUPPORTED_MEDIA_TYPE_STATUS = ApiContract.UNSUPPORTED_MEDIA_TYPE_STATUS;

    /**
     * Probed in this order, first one the path does not map wins. GET before the writes so
     * a read-only path is probed with something it might plausibly be sent, and PUT last
     * because no route in this application maps it -- it is the fallback for a path that
     * already answers every other verb.
     */
    private static final List<String> PROBE_ORDER = List.of("GET", "POST", "PATCH", "DELETE", "PUT");

    /** Matches app.auth.admin-bootstrap-emails in application-test.properties. */
    private static final String ADMIN_EMAIL = "admin@student.kit.edu";

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
     * Every mapped path, called with a verb it does not map.
     *
     * <p>Verb sets are computed per <em>shape</em>, not per pattern string:
     * {@code GET /ratings/{lectureId}} and {@code DELETE /ratings/{id}} are two spellings
     * of one path, and treating them as separate would make this test probe
     * {@code DELETE /ratings/<uuid>} believing it unmapped, hit the moderation handler,
     * and quietly assert nothing.
     */
    @Test
    void everyPathRefusesAnUnmappedVerbWithTheDeclaredStatus() throws Exception {
        String adminToken = adminSession();
        Map<String, Set<String>> verbsByShape = mappedVerbsByShape();

        assertTrue(verbsByShape.size() >= 80,
                "expected the whole API surface, found only " + verbsByShape.size() + " paths");

        List<String> wrong = new ArrayList<>();

        for (String shape : verbsByShape.keySet()) {
            Set<String> reachable = verbsReaching(shape, verbsByShape);

            String probe = PROBE_ORDER.stream()
                    .filter(verb -> !reachable.contains(verb))
                    .findFirst()
                    .orElse(null);
            if (probe == null) {
                continue;
            }

            int status = statusOf(probe, shape, adminToken);
            if (status != WRONG_VERB_STATUS) {
                wrong.add(probe + " " + shape + " -> " + status
                        + " (reachable verbs " + reachable + ")");
            }
        }

        assertTrue(wrong.isEmpty(),
                "these paths did not answer an unmapped verb with " + WRONG_VERB_STATUS
                        + ". If the wrong-verb contract has changed, change WRONG_VERB_STATUS "
                        + "rather than this list: " + wrong);
    }

    /**
     * The refusal above is a real API answer, not a container default, so it carries the
     * project's error body. Worth asserting separately: the status alone would still pass
     * if the body became an empty Tomcat error page.
     */
    @Test
    void wrongVerbCarriesTheProjectErrorBody() throws Exception {
        String adminToken = adminSession();

        // /health maps GET and nothing else, and needs no fixture to exist.
        mockMvc.perform(delete("/health").header("Authorization", bearer(adminToken)))
                .andExpect(status().is(WRONG_VERB_STATUS))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Method not allowed"));
    }

    /**
     * The other half of a 405. A caller told only that its verb is wrong still does not know
     * which verb would have worked, so the header is part of the answer rather than a
     * decoration -- and it is the one piece {@link #wrongVerbCarriesTheProjectErrorBody}
     * cannot see, because the body does not carry it.
     *
     * <p>Swept rather than sampled for the same reason the status is: the header is built in
     * one place from the mapping's own verb set, and a route that stops emitting it would
     * otherwise fail silently.
     */
    @Test
    void everyWrongVerbRefusalNamesTheVerbsThatWouldHaveWorked() throws Exception {
        String adminToken = adminSession();
        Map<String, Set<String>> verbsByShape = mappedVerbsByShape();

        List<String> missing = new ArrayList<>();

        for (String shape : verbsByShape.keySet()) {
            Set<String> reachable = verbsReaching(shape, verbsByShape);

            String probe = PROBE_ORDER.stream()
                    .filter(verb -> !reachable.contains(verb))
                    .findFirst()
                    .orElse(null);
            if (probe == null) {
                continue;
            }

            String allow = headerOf(probe, shape, adminToken, HttpHeaders.ALLOW);
            if (allow == null || allow.isBlank()) {
                missing.add(probe + " " + shape + " (reachable verbs " + reachable + ")");
                continue;
            }

            Set<String> named = Arrays.stream(allow.split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());
            if (!named.containsAll(reachable)) {
                missing.add(probe + " " + shape + " -> Allow: " + allow
                        + " (reachable verbs " + reachable + ")");
            }
        }

        assertTrue(missing.isEmpty(),
                "these paths refused an unmapped verb without naming the verbs that map, "
                        + "which is half of a 405: " + missing);
    }

    /**
     * Every handler that reads a {@code @RequestBody}, handed a body it cannot parse.
     *
     * <p>The handler set is read from the mapping rather than listed, because the failure
     * mode is a new write endpoint inheriting the answer silently -- which is exactly how
     * the current one arrived.
     */
    @Test
    void everyBodyReadingRouteAnswersAnUnsupportedMediaTypeWithTheDeclaredStatus()
            throws Exception {
        String adminToken = adminSession();
        Map<String, String> bodyRoutes = bodyReadingRoutes();

        assertTrue(bodyRoutes.size() >= 20,
                "expected the write surface, found only " + bodyRoutes.size() + " routes");

        List<String> wrong = new ArrayList<>();

        for (Map.Entry<String, String> route : bodyRoutes.entrySet()) {
            String verb = route.getValue();
            String path = route.getKey();

            MockHttpServletRequestBuilder request = requestFor(verb, concrete(path))
                    .header("Authorization", bearer(adminToken))
                    .contentType(MediaType.TEXT_PLAIN)
                    .content("this is not json");

            int status = mockMvc.perform(request).andReturn().getResponse().getStatus();
            if (status != UNSUPPORTED_MEDIA_TYPE_STATUS) {
                wrong.add(verb + " " + path + " -> " + status);
            }
        }

        assertTrue(wrong.isEmpty(),
                "these routes did not answer an unreadable media type with "
                        + UNSUPPORTED_MEDIA_TYPE_STATUS + ". A route answering 500 here means "
                        + "GlobalExceptionHandler.handleUnsupportedMediaType no longer claims "
                        + "HttpMediaTypeNotSupportedException and the catch-all took it back "
                        + "(F-17 regressed): " + wrong);
    }

    /**
     * The 415 carries the project's own error body, not a {@code ProblemDetail}.
     *
     * <p>Separate from the sweep above, which only reads statuses. This is the assertion
     * that would go red if someone "simplified" the narrow handler into extending
     * {@code ResponseEntityExceptionHandler}: the status would stay 415 and the sweep would
     * stay green while the body silently became {@code application/problem+json}, which the
     * Android client does not parse. Mirrors {@link #wrongVerbCarriesTheProjectErrorBody()}.
     */
    @Test
    void unsupportedMediaTypeCarriesTheProjectErrorBody() throws Exception {
        String adminToken = adminSession();

        mockMvc.perform(post("/admin/data/professor")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("this is not json"))
                .andExpect(status().is(UNSUPPORTED_MEDIA_TYPE_STATUS))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Unsupported media type"));
    }

    /**
     * The distinction that made the media-type answer a bug rather than a quirk: an
     * unreadable body in the <em>right</em> media type is a clean 400. Kept after the fix
     * because it is what keeps the two paths apart -- a wrong media type is 415, wrong
     * content in the right media type is 400, and neither may collapse into the other.
     */
    @Test
    void malformedJsonInTheRightMediaTypeIsStillABadRequest() throws Exception {
        String adminToken = adminSession();

        mockMvc.perform(post("/admin/data/professor")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ this is not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid request"));
    }

    /**
     * Every verb that can reach a handler at this path, which is more than the verbs the
     * path itself maps: a literal segment is shadowed by a placeholder sibling of the same
     * length. {@code GET /ratings/rate} is routed to {@code GET /ratings/{lectureId}} and
     * answers 400, because "rate" is not a UUID -- it is a bound handler rejecting its
     * argument, not the wrong-verb refusal this test is about. The same shadowing covers
     * {@code /social/comments/report} under {@code /social/comments/{lecture_id}}.
     *
     * <p>Folding those verbs in here rather than excusing the two paths keeps the sweep
     * exhaustive: both are still probed, just with a verb that genuinely reaches nothing.
     */
    private Set<String> verbsReaching(String shape, Map<String, Set<String>> verbsByShape) {
        String[] segments = shape.split("/", -1);
        Set<String> reachable = new TreeSet<>();

        verbsByShape.forEach((candidate, verbs) -> {
            String[] other = candidate.split("/", -1);
            if (other.length != segments.length) {
                return;
            }
            for (int i = 0; i < segments.length; i++) {
                if (!other[i].equals("{}") && !other[i].equals(segments[i])) {
                    return;
                }
            }
            reachable.addAll(verbs);
        });

        return reachable;
    }

    /** Mapped verbs, keyed by path shape -- every {placeholder} collapsed to one token. */
    private Map<String, Set<String>> mappedVerbsByShape() {
        Map<String, Set<String>> verbs = new TreeMap<>();

        handlerMapping.getHandlerMethods().forEach((info, handler) -> {
            if (!isApplicationHandler(handler)) {
                return;
            }
            for (String pattern : info.getPatternValues()) {
                String shape = shapeOf(pattern);
                for (var method : info.getMethodsCondition().getMethods()) {
                    verbs.computeIfAbsent(shape, key -> new TreeSet<>()).add(method.name());
                }
            }
        });

        return verbs;
    }

    /** Every route whose handler declares a {@code @RequestBody} parameter, path to verb. */
    private Map<String, String> bodyReadingRoutes() {
        Map<String, String> routes = new LinkedHashMap<>();

        handlerMapping.getHandlerMethods().forEach((info, handler) -> {
            if (!isApplicationHandler(handler)) {
                return;
            }
            boolean readsBody = false;
            for (var parameter : handler.getMethodParameters()) {
                if (parameter.hasParameterAnnotation(RequestBody.class)) {
                    readsBody = true;
                    break;
                }
            }
            if (!readsBody) {
                return;
            }
            for (String pattern : info.getPatternValues()) {
                for (var method : info.getMethodsCondition().getMethods()) {
                    routes.put(pattern, method.name());
                }
            }
        });

        return routes;
    }

    private boolean isApplicationHandler(HandlerMethod handler) {
        return handler.getBeanType().getPackageName().startsWith("com.pse");
    }

    /** {@code /users/{id}/warnings/{warningId}} and its twin spelling collapse to one key. */
    private String shapeOf(String pattern) {
        return pattern.replaceAll("\\{[^}]+}", "{}");
    }

    /** A shape or pattern with every placeholder filled by an id that resolves to nothing. */
    private String concrete(String pattern) {
        String path = pattern;
        while (path.contains("{")) {
            path = path.replaceFirst("\\{[^}]*}", UUID.randomUUID().toString());
        }
        return path;
    }

    private int statusOf(String verb, String shape, String rawToken) throws Exception {
        return probe(verb, shape, rawToken).getResponse().getStatus();
    }

    private String headerOf(String verb, String shape, String rawToken, String header)
            throws Exception {
        return probe(verb, shape, rawToken).getResponse().getHeader(header);
    }

    private MvcResult probe(String verb, String shape, String rawToken) throws Exception {
        MockHttpServletRequestBuilder request = requestFor(verb, concrete(shape))
                .header("Authorization", bearer(rawToken));

        if (!"GET".equals(verb)) {
            request = request.contentType(MediaType.APPLICATION_JSON).content("{}");
        }

        return mockMvc.perform(request).andReturn();
    }

    private MockHttpServletRequestBuilder requestFor(String verb, String path) {
        return switch (verb) {
            case "GET" -> get(path);
            case "POST" -> post(path);
            case "PATCH" -> patch(path);
            case "DELETE" -> delete(path);
            case "PUT" -> put(path);
            default -> throw new IllegalArgumentException("unhandled verb " + verb);
        };
    }

    /** A real administrator session through the real admin login endpoints. */
    private String adminSession() throws Exception {
        mockMvc.perform(post("/admin/auth/request-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(ADMIN_EMAIL)))
                .andExpect(status().isOk());

        MvcResult login = mockMvc.perform(post("/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"loginToken\":\"%s\"}"
                                .formatted(ADMIN_EMAIL, codeDelivery.codeFor(ADMIN_EMAIL))))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(login.getResponse().getContentAsString(), "$.authToken");
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
