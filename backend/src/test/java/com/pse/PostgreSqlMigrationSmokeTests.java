package com.pse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = DemoApplication.class)
@AutoConfigureMockMvc
@ContextConfiguration(initializers = PostgreSqlMigrationSmokeTests.PostgreSqlSmokeInitializer.class)
@EnabledIfEnvironmentVariable(named = "POSTGRES_SMOKE_JDBC_URL", matches = ".+")
class PostgreSqlMigrationSmokeTests {

    @Autowired
    MockMvc mockMvc;

    @Test
    void healthReportsHealthyAfterProductionPostgresqlMigrations() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    static final class PostgreSqlSmokeInitializer
            implements ApplicationContextInitializer<ConfigurableApplicationContext> {

        @Override
        public void initialize(ConfigurableApplicationContext context) {
            String jdbcUrl = requiredEnv("POSTGRES_SMOKE_JDBC_URL");
            String username = envOrDefault("POSTGRES_SMOKE_USERNAME", "postgres");
            String password = envOrDefault("POSTGRES_SMOKE_PASSWORD", "postgres");

            resetPublicSchema(jdbcUrl, username, password);

            TestPropertyValues.of(
                    "spring.datasource.url=" + jdbcUrl,
                    "spring.datasource.username=" + username,
                    "spring.datasource.password=" + password,
                    "spring.datasource.driver-class-name=org.postgresql.Driver",
                    "spring.flyway.locations=classpath:db/migration/postgresql",
                    "spring.flyway.baseline-on-migrate=false",
                    "spring.jpa.hibernate.ddl-auto=validate",
                    "app.auth.admin-bootstrap-emails=admin@student.kit.edu:Admin",
                    "app.auth.admin-superuser-emails=admin@student.kit.edu",
                    "app.auth.rate-limit.hmac-key=postgres-smoke-rate-limit-hmac-key-32chars",
                    "app.mail.from-address=test@example.invalid",
                    "app.cors.allowed-origins=http://localhost:5173"
            ).applyTo(context);
        }

        private static void resetPublicSchema(String jdbcUrl, String username, String password) {
            try (Connection connection = connectWithRetry(jdbcUrl, username, password);
                 Statement statement = connection.createStatement()) {
                statement.execute("DROP SCHEMA IF EXISTS public CASCADE");
                statement.execute("CREATE SCHEMA public");
                statement.execute("GRANT ALL ON SCHEMA public TO public");
            } catch (SQLException exception) {
                throw new IllegalStateException("Could not reset PostgreSQL smoke schema", exception);
            }
        }

        private static Connection connectWithRetry(String jdbcUrl, String username, String password) {
            SQLException lastFailure = null;
            for (int attempt = 1; attempt <= 30; attempt++) {
                try {
                    return DriverManager.getConnection(jdbcUrl, username, password);
                } catch (SQLException exception) {
                    lastFailure = exception;
                    sleepBeforeRetry();
                }
            }
            throw new IllegalStateException("PostgreSQL smoke database is not reachable at " + jdbcUrl, lastFailure);
        }

        private static void sleepBeforeRetry() {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while waiting for PostgreSQL smoke database", exception);
            }
        }

        private static String requiredEnv(String name) {
            String value = System.getenv(name);
            if (value == null || value.isBlank()) {
                throw new IllegalStateException(name + " is required for PostgreSQL smoke tests");
            }
            return value;
        }

        private static String envOrDefault(String name, String defaultValue) {
            String value = System.getenv(name);
            return value == null || value.isBlank() ? defaultValue : value;
        }
    }
}
