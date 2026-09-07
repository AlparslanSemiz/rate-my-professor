package com.pse;

import com.pse.support.TestDeliveryConfig;
import com.pse.support.TestGitLabConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Flyway owns production schema changes. This keeps the known production backfill guard in
 * place for the baseline migration: a NOT NULL column added to a populated table needs a
 * database default or a dedicated data backfill.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import({TestDeliveryConfig.class, TestGitLabConfig.class})
class SchemaDefaultsTests {

    @Autowired JdbcTemplate jdbcTemplate;

    /**
     * {@code bug_reports} predates the GitLab issue columns, so it has rows in production
     * that this column has to be added around.
     */
    @Test
    void issueStateCarriesADatabaseDefaultBecauseItIsNotNull() {
        Map<String, Object> column = columnOf("bug_reports", "issue_state");

        assertEquals("NO", column.get("is_nullable"), "issue_state is expected to be NOT NULL");
        assertNotNull(
                column.get("column_default"),
                "a NOT NULL column on an already populated table needs a database-level "
                        + "default or a dedicated Flyway backfill"
        );
    }

    private Map<String, Object> columnOf(String table, String column) {
        return jdbcTemplate.queryForMap(
                "select is_nullable, column_default from information_schema.columns "
                        + "where lower(table_name) = ? and lower(column_name) = ?",
                table,
                column
        );
    }
}
