package com.pse.moderation.dto.request;

import java.util.List;
import java.util.UUID;

/**
 * Partial update of a professor. An omitted (null) field is left alone; at least one has
 * to be supplied. {@code lectureIds} replaces the assignment wholesale — pass {@code []}
 * to detach the professor from every lecture.
 */
public record ProfessorUpdateRequest(
        String firstName,
        String lastName,
        Boolean active,
        List<UUID> lectureIds
) {
}
