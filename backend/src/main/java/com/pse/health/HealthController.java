package com.pse.health;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.shared.error.ApiException;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public BasicResponse health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return new BasicResponse("API healthy", true);
        } catch (DataAccessException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "API unhealthy");
        }
    }
}
