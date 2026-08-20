package com.pse.moderation.dto.response;

import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;

import java.util.UUID;

/**
 * A user as the panel lists and inspects them. Returned inside {@link UserListResponse} by
 * {@code GET /users}, and on its own — deliberately unwrapped — by {@code GET /users/{id}}.
 *
 * @param credibilityScore the account's standing, derived from the votes its content received
 *                         and overridable through {@code PATCH /users/{id}}. Returned so an
 *                         operator adjusting it can see what they are adjusting from.
 */
public record UserResponse(
        UUID id,
        String username,
        String kitEmail,
        UserRole role,
        UserStatus status,
        String joined,
        String lastOnline,

        String biography,
        int warnings,
        int reports,
        int credibilityScore
) {}
