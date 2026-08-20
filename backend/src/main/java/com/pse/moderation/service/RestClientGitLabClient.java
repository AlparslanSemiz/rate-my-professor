package com.pse.moderation.service;

import com.pse.shared.error.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

/**
 * Talks to the GitLab issues API over HTTP.
 *
 * <p>The token is read from the environment and used only as a request header. It is never
 * logged, never returned in a response and never sent anywhere else — a token that reaches
 * the browser is a leaked token, which is the whole reason issue creation lives in the
 * backend rather than in the admin panel.
 */
@Component
public class RestClientGitLabClient implements GitLabClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(RestClientGitLabClient.class);

    private final RestClient restClient;
    private final String projectId;
    private final String token;

    public RestClientGitLabClient(
            @Value("${app.gitlab.base-url:}") String baseUrl,
            @Value("${app.gitlab.project-id:}") String projectId,
            @Value("${app.gitlab.token:}") String token,
            @Value("${app.gitlab.timeout:PT10S}") Duration timeout
    ) {
        this.projectId = projectId == null ? "" : projectId.trim();
        this.token = token == null ? "" : token.trim();
        String trimmedBase = baseUrl == null ? "" : baseUrl.trim().replaceAll("/+$", "");
        this.restClient = trimmedBase.isEmpty()
                ? null
                : RestClient.builder()
                        .baseUrl(trimmedBase)
                        // Explicit timeouts: an unreachable tracker must fail the one request
                        // that asked for an issue, not hold a request thread indefinitely.
                        .requestFactory(timeoutRequestFactory(timeout))
                        .build();
    }

    private static org.springframework.http.client.ClientHttpRequestFactory timeoutRequestFactory(
            Duration timeout
    ) {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) timeout.toMillis());
        factory.setReadTimeout((int) timeout.toMillis());
        return factory;
    }

    @Override
    public boolean isEnabled() {
        return restClient != null && !projectId.isEmpty() && !token.isEmpty();
    }

    @Override
    public CreatedIssue createIssue(String title, String description) {
        if (!isEnabled()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE, "GitLab integration is not configured");
        }
        String path = "/api/v4/projects/"
                + URLEncoder.encode(projectId, StandardCharsets.UTF_8)
                + "/issues";
        try {
            Map<?, ?> body = restClient.post()
                    .uri(path)
                    .header("PRIVATE-TOKEN", token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("title", title, "description", description))
                    .retrieve()
                    .body(Map.class);
            if (body == null || body.get("web_url") == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "GitLab did not return an issue");
            }
            Object iid = body.get("iid");
            return new CreatedIssue(
                    String.valueOf(body.get("web_url")),
                    iid instanceof Number number ? number.intValue() : null
            );
        } catch (ApiException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            // The message may quote the request; log the class and let the caller answer with
            // something that cannot echo a credential back.
            LOGGER.error("GitLab issue creation failed: {}", exception.getClass().getName());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not reach GitLab");
        }
    }
}
