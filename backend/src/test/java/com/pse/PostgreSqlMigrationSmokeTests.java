package com.pse;

import com.pse.support.PostgresTestDatabase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The production migrations, run against a real PostgreSQL rather than the H2 translation
 * the rest of the suite uses.
 *
 * <p>The annotations here are load-bearing and are repeated verbatim on every class using
 * {@link PostgresTestDatabase}: identical context configuration is what makes Spring hand
 * them one cached context, and the initializer resets the schema, so a second context would
 * wipe the first one's data mid-run.
 */
@SpringBootTest(classes = DemoApplication.class)
@AutoConfigureMockMvc
@ContextConfiguration(initializers = PostgresTestDatabase.class)
@EnabledIfEnvironmentVariable(named = PostgresTestDatabase.URL_VARIABLE, matches = ".+")
class PostgreSqlMigrationSmokeTests {

    @Autowired
    MockMvc mockMvc;

    @Test
    void healthReportsHealthyAfterProductionPostgresqlMigrations() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
