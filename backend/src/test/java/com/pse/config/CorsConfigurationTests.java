package com.pse.config;

import com.pse.support.TestDeliveryConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the two ways the Admin Web was locked out of the deployed backend: an empty
 * origin allow-list, which answered every browser call with 403, and CORS preflight
 * being evaluated by the role matchers, which answered admin routes with 401.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestDeliveryConfig.class)
class CorsConfigurationTests {

    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    @Autowired MockMvc mockMvc;

    @Test
    @WithAnonymousUser
    void preflightForLoginIsAllowedForConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/auth/request-login")
                        .header("Origin", ALLOWED_ORIGIN)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN));
    }

    /**
     * A preflight carries no Authorization header, so it must never reach the
     * {@code hasRole("ADMIN")} matcher for {@code /users/**}.
     */
    @Test
    @WithAnonymousUser
    void preflightForAdminRouteIsNotRejectedAsUnauthenticated() throws Exception {
        mockMvc.perform(options("/users")
                        .header("Origin", ALLOWED_ORIGIN)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN));
    }

    @Test
    @WithAnonymousUser
    void preflightFromUnknownOriginIsRejected() throws Exception {
        mockMvc.perform(options("/auth/request-login")
                        .header("Origin", "https://attacker.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void blankConfigurationFallsBackToLocalDevelopmentOrigins() {
        assertEquals(
                List.of("http://localhost:5173", "http://127.0.0.1:5173"),
                allowedOrigins("   ,  ,")
        );
    }

    @Test
    void configuredOriginsAreTrimmed() {
        assertEquals(
                List.of("https://admin.example", "http://localhost:5173"),
                allowedOrigins(" https://admin.example , http://localhost:5173 ")
        );
    }

    @Test
    void wildcardOriginIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> new CorsConfig("https://*.example"));
    }

    private static List<String> allowedOrigins(String configuredValue) {
        UrlBasedCorsConfigurationSource source =
                (UrlBasedCorsConfigurationSource) new CorsConfig(configuredValue).corsConfigurationSource();
        CorsConfiguration configuration = source.getCorsConfigurations().get("/**");
        return configuration.getAllowedOrigins();
    }
}
