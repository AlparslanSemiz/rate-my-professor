package com.pse.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The administrators that may moderate other administrators.
 *
 * <p>Entries are comma separated addresses. Being listed here grants nothing on its
 * own: elevation only lifts the refusals that protect administrator accounts, so an
 * address still has to be in {@code admins} — {@link AdminBootstrapPolicy} is what puts
 * it there — before any of it applies.
 *
 * <p>Elevation is deliberately not a role. {@code /auth/me}, the user listing and every
 * audit actor keep reporting {@code ADMIN} for these accounts; the distinction travels
 * as a separate field.
 */
@Component
public class AdminSuperuserPolicy {

    private final Set<String> superuserEmails;

    public AdminSuperuserPolicy(@Value("${app.auth.admin-superuser-emails:}") String configuredEmails) {
        this.superuserEmails = Arrays.stream(configuredEmails.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
    }

    /** Whether this address is an elevated operator. Admin membership is checked separately. */
    public boolean isSuperuser(String kitEmail) {
        return kitEmail != null
                && superuserEmails.contains(kitEmail.trim().toLowerCase(Locale.ROOT));
    }

    public Set<String> superuserEmails() {
        return superuserEmails;
    }
}
