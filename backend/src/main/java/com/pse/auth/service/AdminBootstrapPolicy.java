package com.pse.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AdminBootstrapPolicy {

    private final Set<String> bootstrapEmails;

    public AdminBootstrapPolicy(@Value("${app.auth.admin-bootstrap-emails:}") String configuredEmails) {
        this.bootstrapEmails = Arrays.stream(configuredEmails.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean shouldBootstrap(String normalizedEmail) {
        return bootstrapEmails.contains(normalizedEmail);
    }
}
