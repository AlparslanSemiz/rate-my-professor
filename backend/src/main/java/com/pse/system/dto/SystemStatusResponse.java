package com.pse.system.dto;

/**
 * Answer of {@code GET /system/status}.
 *
 * <p>The endpoint always answers {@code 200} as long as the API itself is serving, and
 * reports a failing database in {@code status} instead. A page that has to show "the API
 * is up but the database is not" cannot do that if the request itself fails.
 *
 * @param status         {@code OK}, {@code DEGRADED} (database up, a read failed), or
 *                       {@code DOWN} (database unreachable)
 * @param checkedAt      UTC ISO 8601 timestamp of this check
 * @param startedAt      UTC ISO 8601 timestamp of the last backend start
 * @param uptimeSeconds  seconds since {@code startedAt}
 * @param counts         table counts, {@code null} when they could not be read
 * @param lastWrite      newest audit event, {@code null} when there is none
 */
public record SystemStatusResponse(
        String message,
        boolean success,
        String status,
        String checkedAt,
        String startedAt,
        long uptimeSeconds,
        SystemDatabaseResponse database,
        SystemCountsResponse counts,
        SystemLastWriteResponse lastWrite
) {
}
