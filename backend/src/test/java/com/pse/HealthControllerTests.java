package com.pse;

import com.pse.health.HealthController;
import com.pse.shared.error.ApiException;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationInfoService;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthControllerTests {

    @Test
    void databaseFailureProducesServiceUnavailable() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Flyway flyway = mock(Flyway.class);
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> new HealthController(jdbcTemplate, flyway).health()
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertEquals("API unhealthy", exception.getMessage());
    }

    @Test
    void pendingMigrationProducesServiceUnavailable() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Flyway flyway = mock(Flyway.class);
        MigrationInfoService info = mock(MigrationInfoService.class);
        MigrationInfo pending = mock(MigrationInfo.class);

        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
        when(flyway.info()).thenReturn(info);
        when(info.all()).thenReturn(new MigrationInfo[0]);
        when(info.pending()).thenReturn(new MigrationInfo[]{pending});

        ApiException exception = assertThrows(
                ApiException.class,
                () -> new HealthController(jdbcTemplate, flyway).health()
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
        assertEquals("API unhealthy", exception.getMessage());
    }
}
