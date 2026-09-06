package com.pse.config;

import tools.jackson.databind.ObjectMapper;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.security.AccessRefusalAuditor;
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
            AccessRefusalAuditor accessRefusalAuditor,
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
                        .requestMatchers(
                                HttpMethod.POST,
                                "/auth/request-login",
                                "/auth/login",
                                "/auth/validate",
                                "/admin/auth/request-login",
                                "/admin/auth/login"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()
                        // The admin API is one surface with one rule. The two login routes above
                        // are its only anonymous entries and are matched first; everything else
                        // under /admin needs an admin session. Kept here, ahead of every other
                        // matcher, so no later rule -- least of all anyRequest().permitAll() --
                        // can widen an /admin path by accident. It does not capture /admins/**:
                        // patterns match whole segments, and "admins" is not "admin".
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/account/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/data/lectures").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/social/notifications").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/social/notifications").authenticated()
                        .requestMatchers(
                                HttpMethod.POST,
                                "/social/comments",
                                "/social/comments/vote/**",
                                "/social/answers",
                                "/social/comments/report",
                                "/social/answers/report"
                        ).authenticated()
                        .requestMatchers(HttpMethod.GET, "/social/notifications").authenticated()
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/social/notifications/all",
                                "/social/notifications/*"
                        ).authenticated()
                        .requestMatchers(HttpMethod.POST, "/ratings/rate").authenticated()
                        .requestMatchers(HttpMethod.GET, "/ratings/own/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.POST, "/auth/logout-all").authenticated()
                        .requestMatchers(HttpMethod.GET, "/auth/me").authenticated()
                        .requestMatchers(
                                "/users/**",
                                "/comments",
                                "/comments/reported/**",
                                "/answers",
                                "/answers/reported/**",
                                "/ratings",
                                "/audit-logs/**",
                                "/activity-logs/**",
                                "/admins/**",
                                "/system/**"
                        )
                        .hasRole("ADMIN")
                        // The content itself is edited and removed by id. The student app
                        // reads comments under /social and never writes to these paths, so
                        // only the admin verbs are matched here.
                        .requestMatchers(HttpMethod.PATCH, "/comments/**", "/answers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/comments/**", "/answers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/ratings/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/data/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/data/**").hasRole("ADMIN")
                        // Unlike the rest of /data, these two reads are admin-only: they are
                        // the panel's only way back to a lecture or professor it deactivated,
                        // since the public catalogue reads filter to active = true.
                        .requestMatchers(HttpMethod.GET, "/data/lectures/all", "/data/professor/all")
                        .hasRole("ADMIN")
                        // Ahead of the student submission route below: POST /reports is how a
                        // student files a bug and must stay open, but opening a tracker issue
                        // for one is an administrative action.
                        .requestMatchers(HttpMethod.POST, "/reports/*/gitlab-issue").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/reports", "/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/reports/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/reports/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                writeError(response, objectMapper, 401, "Not logged in"))
                        .accessDeniedHandler((request, response, exception) -> {
                            accessRefusalAuditor.record(request);
                            writeError(response, objectMapper, 403, "Could not authenticate Admin");
                        })
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
