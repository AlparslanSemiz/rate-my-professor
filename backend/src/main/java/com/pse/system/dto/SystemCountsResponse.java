package com.pse.system.dto;

/**
 * Row counts of the tables the admin panel works with. {@code users} excludes
 * soft-deleted accounts, matching what {@code GET /users} returns.
 */
public record SystemCountsResponse(
        long users,
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
