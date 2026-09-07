package com.pse.support;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Points a Spring context at a real PostgreSQL and runs the production migrations against it.
 *
 * <p><b>Why this exists rather than Testcontainers.</b> The integration layer was recorded as
 * blocked on adopting Testcontainers, which would have meant a new dependency and a Docker
 * daemon in the build. It turned out not to be needed: the pipeline already runs a real
 * {@code postgres:16} as a GitLab CI <em>service</em> for the migration smoke test, and a
 * service is reachable over TCP without a Docker socket, a privileged runner or any
 * dependency at all. This class is that job's setup, generalised so more than one test class
 * can use it.
 *
 * <p>Tests using it declare
 * {@code @EnabledIfEnvironmentVariable(named = "POSTGRES_SMOKE_JDBC_URL", matches = ".+")},
 * so they are skipped on a developer machine with no database and run in CI where the
 * service exists. That keeps the local build Docker-free, which was the constraint the
 * Testcontainers question was really about.
 *
 * <p><b>Share the context.</b> {@link #initialize} drops and recreates the {@code public}
 * schema, so two contexts using it would wipe each other. Test classes must therefore carry
 * <em>identical</em> context configuration -- same annotations, same initializer -- so Spring's
 * context cache hands them one context and the reset happens once. Anything that would fork a
 * second context (a {@code @MockitoBean}, different properties) has to reset the schema itself
 * instead.
 */
public final class PostgresTestDatabase
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    /** The variable that both selects this database and decides whether the tests run. */
    public static final String URL_VARIABLE = "POSTGRES_SMOKE_JDBC_URL";

    private static final int CONNECT_ATTEMPTS = 30;

    @Override
    public void initialize(ConfigurableApplicationContext context) {
        String jdbcUrl = requiredEnv(URL_VARIABLE);
        String username = envOrDefault("POSTGRES_SMOKE_USERNAME", "postgres");
        String password = envOrDefault("POSTGRES_SMOKE_PASSWORD", "postgres");

        resetPublicSchema(jdbcUrl, username, password);

        TestPropertyValues.of(
                "spring.datasource.url=" + jdbcUrl,
                "spring.datasource.username=" + username,
                "spring.datasource.password=" + password,
                "spring.datasource.driver-class-name=org.postgresql.Driver",
                // The production migrations, not the H2 ones the rest of the suite runs.
                // Proving them is half the point of testing against a real server.
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
            throw new IllegalStateException("Could not reset PostgreSQL schema", exception);
        }
    }

    /**
     * The service container and the job start together, so the first connections are
     * expected to fail. Retrying is what makes the job depend on the database being up
     * rather than on it having been up first.
     */
    private static Connection connectWithRetry(String jdbcUrl, String username, String password) {
        SQLException lastFailure = null;
        for (int attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
            try {
                return DriverManager.getConnection(jdbcUrl, username, password);
            } catch (SQLException exception) {
                lastFailure = exception;
                sleepBeforeRetry();
            }
        }
        throw new IllegalStateException(
                "PostgreSQL is not reachable at " + jdbcUrl, lastFailure);
    }

    private static void sleepBeforeRetry() {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for PostgreSQL", exception);
        }
    }

    private static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is required for PostgreSQL tests");
        }
        return value;
    }

    private static String envOrDefault(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
