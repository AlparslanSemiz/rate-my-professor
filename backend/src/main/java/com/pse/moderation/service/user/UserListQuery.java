package com.pse.moderation.service.user;

import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
import com.pse.user.model.Student;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

/**
 * How {@code GET /users} turns its query string into a specification.
 *
 * <p>Apart from {@code UserDirectoryService} so that the listing reads as a listing: parsing
 * four string parameters and deciding what a role filter means is not what a directory does,
 * it is what its caller asked for. Package-private, because nothing outside this package has
 * a query string to parse.
 */
final class UserListQuery {

    private UserListQuery() {
    }

    /**
     * Role is membership of the {@code admins} table rather than a column on the student, so
     * it filters as an id set. The empty set still has to produce a valid predicate:
     * {@code IN ()} is not legal SQL, so both degenerate cases are answered directly.
     */
    static Predicate rolePredicate(
            CriteriaBuilder builder,
            Root<Student> root,
            Set<UUID> adminIds,
            UserRole role
    ) {
        if (adminIds.isEmpty()) {
            return role == UserRole.ADMIN ? builder.disjunction() : builder.conjunction();
        }
        Predicate isAdmin = root.get("id").in(adminIds);
        return role == UserRole.ADMIN ? isAdmin : builder.not(isAdmin);
    }

    static UserStatus parseStatusFilter(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return null;
        }
        UserStatus status;
        try {
            status = UserStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user status");
        }
        // Filtering for DELETED can only ever return nothing, because deleted accounts are
        // excluded unconditionally. An empty page would read as "no deleted accounts exist".
        if (status == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deleted users are not listed");
        }
        return status;
    }

    static UserRole parseUserRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return null;
        }
        try {
            return UserRole.valueOf(rawRole.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user role");
        }
    }

    /**
     * {@code sort=newest} (the default) or {@code sort=oldest}, as the direction the keyset
     * ordering runs in. Resolved to a {@code Sort.Direction} here rather than carried as a
     * {@code newestFirst} boolean: the flag had to be read the same way at the cursor
     * predicate and at the {@code Sort}, and nothing tied the two together.
     */
    static Sort.Direction parseSortDirection(String rawSort) {
        if (rawSort == null || rawSort.isBlank() || rawSort.trim().equalsIgnoreCase("newest")) {
            return Sort.Direction.DESC;
        }
        if (rawSort.trim().equalsIgnoreCase("oldest")) {
            return Sort.Direction.ASC;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user sort");
    }
}
