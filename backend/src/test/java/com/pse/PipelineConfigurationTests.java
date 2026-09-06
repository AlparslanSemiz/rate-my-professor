package com.pse;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Guards {@code .gitlab-ci.yml} against the mistakes that make GitLab reject the file
 * outright.
 *
 * <p>A rejected file runs <em>zero</em> jobs, so no CI job can ever catch this — the only
 * place a check helps is a local build, which is why it is a test. It has already cost us a
 * merge request: a script line reading
 * {@code - echo "Restore with: gpg -d ..."} is a mapping to YAML, not a string, because of
 * the colon and space inside it. GitLab answered "script config should be a string or a
 * nested array of strings", produced no pipeline at all, and that silence hid a red test
 * suite on the same branch for days.
 */
class PipelineConfigurationTests {

    private static final Path PIPELINE = Path.of(".gitlab-ci.yml");

    /** The three keys GitLab requires to be strings, or nested arrays of strings. */
    private static final List<String> SCRIPT_KEYS = List.of("script", "before_script", "after_script");

    @Test
    void pipelineConfigurationParsesAndDeclaresItsStages() throws IOException {
        Map<String, Object> pipeline = load();

        assertInstanceOf(List.class, pipeline.get("stages"),
                ".gitlab-ci.yml parsed, but has no stages list — check the file is intact");
    }

    @Test
    void everyScriptEntryIsAString() throws IOException {
        assertEquals(
                List.of(),
                nonStringScriptEntries(load()),
                "GitLab rejects the whole file, and runs no jobs at all, when a script entry "
                        + "is not a string. Wrap the line in a block scalar: \"- |\" on its own "
                        + "line, the command indented under it."
        );
    }

    @Test
    void theRuleCatchesTheMappingThatBrokeAMergeRequest() {
        // The exact shape that did it. Without this, a guard that quietly stopped working
        // would still look green.
        String malformed = """
                backup:offsite:
                  script:
                    - echo "Restore with:  gpg -d dump.sql.gz.gpg | gunzip | psql -U postgres"
                """;

        List<String> offenders = nonStringScriptEntries(new Yaml().load(malformed));

        assertEquals(1, offenders.size(), offenders.toString());
        assertTrue(offenders.get(0).startsWith("backup:offsite.script[0]"), offenders.get(0));
    }

    private static Map<String, Object> load() throws IOException {
        assertTrue(Files.exists(PIPELINE),
                PIPELINE.toAbsolutePath() + " not found — tests must run from the project root");
        try (Reader reader = Files.newBufferedReader(PIPELINE, StandardCharsets.UTF_8)) {
            return new Yaml().load(reader);
        }
    }

    /** Every entry GitLab would reject, named well enough to find the line. */
    private static List<String> nonStringScriptEntries(Map<String, Object> pipeline) {
        List<String> offenders = new ArrayList<>();
        pipeline.forEach((jobName, definition) -> {
            if (!(definition instanceof Map<?, ?> job)) {
                return;
            }
            for (String key : SCRIPT_KEYS) {
                if (!(job.get(key) instanceof List<?> entries)) {
                    continue;
                }
                for (int index = 0; index < entries.size(); index++) {
                    Object entry = entries.get(index);
                    if (entry instanceof String) {
                        continue;
                    }
                    offenders.add(jobName + "." + key + "[" + index + "] is "
                            + (entry == null ? "empty" : "a " + entry.getClass().getSimpleName())
                            + ", not a string");
                }
            }
        });
        return offenders;
    }
}
