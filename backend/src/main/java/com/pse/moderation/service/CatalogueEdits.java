package com.pse.moderation.service;

import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import com.pse.shared.error.ApiException;
import org.springframework.http.HttpStatus;

/**
 * The bits an edit to a lecture and an edit to a professor do the same way: validate a name,
 * resolve a list of ids to rows, and decide whether an assignment actually changed.
 *
 * <p>{@link #resolveAll} is one method where there were two -- {@code resolveProfessors} and
 * {@code resolveLectures} were the same body with the type swapped, down to the shape of the
 * count comparison that catches an unknown id.
 */
final class CatalogueEdits {

    private static final int MAX_NAME_LENGTH = 200;

    private CatalogueEdits() {
    }

    /**
     * Every row named by {@code ids}, or a 404 naming what was missing.
     *
     * <p>The comparison is against the number of <em>distinct</em> ids: a request repeating an
     * id is not a request for a row that does not exist, and must not be answered as one.
     *
     * @param <T> the type parameter
     * @param ids the ids
     * @param findAllById the findAllById
     * @param missingMessage the missingMessage
     * @return the result
     *
     * @throws ApiException if the operation fails
     */
    static <T> List<T> resolveAll(List<UUID> ids, Function<List<UUID>, List<T>> findAllById,
                                  String missingMessage) {
        List<T> found = findAllById.apply(ids);
        if (found.size() != ids.stream().distinct().count()) {
            throw new ApiException(HttpStatus.NOT_FOUND, missingMessage);
        }
        return found;
    }

    static String requireName(String raw, String message) {
        String name = raw.trim();
        if (name.isEmpty() || name.length() > MAX_NAME_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return name;
    }

    static List<String> labels(List<UUID> ids) {
        return ids.stream().map(UUID::toString).toList();
    }

    /**
     * Whether two id assignments hold the same members, regardless of the order they come
     * out in. Both sides are read from a {@code Set} on one end and from a request or a
     * repository lookup on the other, so position carries no information -- BUG-3.
     *
     * @param before the before
     * @param after the after
     * @return the result
     */
    static boolean sameAssignment(List<UUID> before, List<UUID> after) {
        return sorted(before).equals(sorted(after));
    }

    private static List<String> sorted(List<UUID> ids) {
        return ids.stream().map(UUID::toString).sorted().toList();
    }
}
