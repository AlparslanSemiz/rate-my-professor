package com.pse.config;

import tools.jackson.databind.ObjectMapper;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.security.BearerTokenAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            BearerTokenAuthenticationFilter bearerTokenFilter,
            ObjectMapper objectMapper
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                // Picks up the CorsConfigurationSource from CorsConfig. Handling CORS in
                // the chain is what keeps preflight requests out of the role matchers
                // below, which would otherwise answer an unauthenticated OPTIONS with 401.
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.POST, "/auth/request-login", "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.POST, "/auth/logout-all").authenticated()
                        .requestMatchers(HttpMethod.GET, "/auth/me").authenticated()
                        .requestMatchers(
                                "/users/**",
                                "/comments/reported/**",
                                "/audit-logs/**",
                                "/admins/**"
                        )
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/reports", "/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/reports/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                writeError(response, objectMapper, 401, "Not logged in"))
                        .accessDeniedHandler((request, response, exception) ->
                                writeError(response, objectMapper, 403, "Could not authenticate Admin"))
                )
                .addFilterBefore(bearerTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void writeError(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            int status,
            String message
    ) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new BasicResponse(message, false));
    }
}
