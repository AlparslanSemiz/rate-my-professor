package com.pse.professor.dto.response;

import java.util.List;

public record ProfessorsResponse(
        String message,
        boolean success,
        List<ProfessorResponse> professors
) {
}
