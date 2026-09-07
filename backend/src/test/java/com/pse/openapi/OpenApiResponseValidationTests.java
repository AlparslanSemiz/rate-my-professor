package com.pse.openapi;

import com.atlassian.oai.validator.OpenApiInteractionValidator;
import com.atlassian.oai.validator.mockmvc.MockMvcResponse;
import com.atlassian.oai.validator.model.Request;
import com.atlassian.oai.validator.report.ValidationReport;
import com.pse.auth.repository.TokenRepository;
import com.pse.moderation.repository.AdminRepository;
import com.pse.support.AdminSessions;
import com.pse.support.TestDeliveryConfig;
import com.pse.support.TestGitLabConfig;
import com.pse.user.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The other half of the contract: {@link OpenApiContractTests} proves the schema covers every
 * route, this proves the bodies actually match what it says about them.
 *
 * <p>The schema is fetched from the running context rather than read from a checked-in file,
 * so there is no generation step to forget and no copy to go stale.
 */
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import({TestDeliveryConfig.class, TestGitLabConfig.class})
class OpenApiResponseValidationTests {

    private static final String ADMIN_EMAIL = "openapi-validate@student.kit.edu";

    /**
     * Every readable GET worth sweeping, in the shape the validator wants them.
     */
    private static final List<String> READ_PATHS = List.of(
            "/health",
            "/admin/users",
            "/admin/system/status",
            "/admin/audit-logs",
            "/admin/activity-logs",
            "/admin/comments",
            "/admin/answers",
            "/admin/reports",
            "/admin/ratings",
            "/admin/data/lectures/all",
            "/admin/data/professor/all",
            "/admin/auth/me",
            "/data/lectures",
            "/data/professor",
            "/social/sync/comments");

    /**
     * Response fields the schema is knowingly wrong about, as {@code path -> JSON pointer}.
     *
     * <p>A springdoc limitation. {@code @Schema(nullable = true)} produces the right 3.1
     * type union on a scalar -- every cursor and {@code database.error} carry it and
     * validate -- but on a property that is a {@code $ref} it emits
     * {@code {"type":"null","$ref":…}}, which says the value can <em>only</em> be null.
     * Neither form is right, so the annotation is not used on {@code counts} or
     * {@code lastWrite}, and the mismatch is named here rather than hidden by skipping the
     * endpoint: everything else about {@code GET /admin/system/status} is still checked.
     *
     * <p>One entry, not two. {@code counts} has the same defect in the schema, but this
     * fixture cannot reach it: the database is up, so {@code counts} is an object and
     * matches, and it is only null when a read fails. Listing it anyway would be claiming
     * an observation this sweep does not make -- the same way an over-broad exemption list
     * passes by looking at less than it thinks.
     *
     * <p>Declared as an exact set, so a <em>new</em> mismatch fails even on a path that
     * already has a known one.
     */
    private static final Set<String> KNOWN_SCHEMA_GAPS = Set.of(
            "/admin/system/status /lastWrite"
    );

    @Autowired MockMvc mockMvc;
    @Autowired StudentRepository studentRepository;
    @Autowired AdminRepository adminRepository;
    @Autowired TokenRepository tokenRepository;

    private String adminToken;
    private OpenApiInteractionValidator validator;

    @BeforeEach
    void createAdminSessionAndLoadSchema() throws Exception {
        adminToken = AdminSessions.createAdmin(
                ADMIN_EMAIL, studentRepository, adminRepository, tokenRepository);

        String schema = mockMvc.perform(get("/v3/api-docs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        validator = OpenApiInteractionValidator.createForInlineApiSpecification(schema).build();
    }

    @Test
    void everyReadableResponseMatchesTheSchemaThatDescribesIt() throws Exception {
        Set<String> mismatches = new TreeSet<>();

        for (String path : READ_PATHS) {
            for (String pointer : mismatchedPointers(path)) {
                if (!KNOWN_SCHEMA_GAPS.contains(path + " " + pointer)) {
                    mismatches.add(path + " " + pointer);
                }
            }
        }

        assertTrue(mismatches.isEmpty(),
                "these response fields do not match the schema that describes them. Either "
                        + "the schema is wrong (annotate the field) or the response is: "
                        + mismatches);
    }

    /**
     * The JSON pointers the validator objected to, e.g. {@code /nextCursor}.
     *
     * <p>Taken from {@link ValidationReport} rather than from the MockMvc matcher. The
     * matcher reports a failure by throwing, with everything useful inside the exception's
     * rendered message -- and reading it back out meant a regular expression over a
     * library's error text, which breaks the first time that text is reworded. The validator
     * hands the same information over as typed messages, so this asks it directly.
     */
    private List<String> mismatchedPointers(String path) throws Exception {
        MockHttpServletResponse response = mockMvc.perform(get(path)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn().getResponse();

        ValidationReport report = validator.validateResponse(
                path, Request.Method.GET, MockMvcResponse.of(response));

        return report.getMessages().stream()
                .filter(message -> message.getLevel() == ValidationReport.Level.ERROR)
                .map(message -> message.getContext()
                        .flatMap(ValidationReport.MessageContext::getPointers)
                        .map(ValidationReport.MessageContext.Pointers::getInstance)
                        // A message the report gives no pointer for is still a failure, and
                        // dropping it would let the sweep pass by ignoring what it cannot
                        // categorise.
                        .orElseGet(() -> "(no pointer) " + message.getMessage()))
                .toList();
    }
}
