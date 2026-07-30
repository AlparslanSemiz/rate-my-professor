package com.pse.professor.dto.response;

import java.util.UUID;

public record ProfessorShortResponse(
        UUID id,
        String firstName,
        String lastName,
        boolean active
) {
}