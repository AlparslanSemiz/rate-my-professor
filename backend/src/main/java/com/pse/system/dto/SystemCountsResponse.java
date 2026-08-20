package com.pse.system.dto;

/**
 * Row counts of the tables the admin panel works with. {@code users} excludes
 * soft-deleted accounts, matching what {@code GET /users} returns, and {@code activeUsers}
 * narrows that to the accounts whose status is {@code ACTIVE} — the two differ by the
 * inactive and blocked ones. {@code admins} counts the accounts that hold the role, which
 * is the {@code admins} table and not the bootstrap allowlist.
 *
 * <p>Every counter here exists so a dashboard tile does not have to page a whole listing
 * for one number; adding a tile without a counter puts that read back.
 */
public record SystemCountsResponse(
        long users,
        long activeUsers,
        long admins,
        long lectures,
        long comments,
        long answers,
        long ratings,
        long openCommentReports,
        long openBugReports,
        long auditEvents
) {
}
