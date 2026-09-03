package com.pse.professor.dto.request;


import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record ProfessorAddRequest(
        @NotBlank
        String firstName,
        @NotBlank
        String lastName,
        List<UUID> lectureIDs
) {
}
