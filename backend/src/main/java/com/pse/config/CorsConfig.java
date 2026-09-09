package com.pse.config;

import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Provides CorsConfig.
 */
@Configuration
public class CorsConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(CorsConfig.class);

    /**
     * Used when the configured value contains no usable origin. An empty allow-list
     * answers every browser call with an opaque 403 "Invalid CORS request", login
     * included, so the panel becomes unreachable with nothing in the response that
     * points at the cause. The deployment forwards the variable unconditionally, so
     * an unset CI variable arrives as an empty string and never falls back to the
     * placeholder default in application.properties.
     */
    private static final List<String> DEFAULT_ORIGINS =
            List.of("http://localhost:5173", "http://127.0.0.1:5173");

    private final List<String> allowedOrigins;

    /**
     * Creates CorsConfig.
     *
     * @param allowedOrigins the allowedOrigins
     */
    public CorsConfig(@Value("${app.cors.allowed-origins}") String allowedOrigins) {
        this.allowedOrigins = parseOrigins(allowedOrigins);
    }

    /**
     * Registered as a bean rather than through {@code WebMvcConfigurer} so that the
     * filter chain's own CORS support picks it up. Spring MVC handles CORS after
     * authorization, which made every preflight to an admin route fail with 401:
     * {@code OPTIONS} carries no Authorization header, and the role matchers for
     * {@code /users/**} and friends are not restricted by method.
     *
     * @return the result
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(
                List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static List<String> parseOrigins(String configuredValue) {
        List<String> origins = Arrays.stream(configuredValue.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .peek(origin -> {
                    if (origin.contains("*")) {
                        throw new IllegalArgumentException("Wildcard CORS origins are not allowed");
                    }
                })
                .toList();

        if (origins.isEmpty()) {
            LOGGER.warn(
                    "No CORS origins configured; falling back to {}. Set ADMIN_FRONTEND_ORIGINS to "
                            + "the Admin Web origin, otherwise the panel cannot reach this backend.",
                    DEFAULT_ORIGINS
            );
            return DEFAULT_ORIGINS;
        }
        LOGGER.info("CORS allow-list: {}", origins);
        return origins;
    }
}
