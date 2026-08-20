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
 * Production runs {@code ddl-auto=update} with no migration files, so a new column either
 * appears on deploy or never does. Postgres refuses to add a NOT NULL column to a table that
 * already holds rows unless the column brings a default for them, and Hibernate logs a failed
 * schema update rather than aborting startup: the application comes up without the column and
 * fails on the first read of that table instead.
 *
 * <p>The test database is H2 with {@code create-drop}, which builds every table from scratch
 * and so can never reproduce that. This asserts the property the real deploy depends on.
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
                        + "default, otherwise ddl-auto=update cannot add it on deploy"
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
