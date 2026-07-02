package com.pse.professor.dto.request;


import java.util.List;
import java.util.UUID;

public record ProfessorAddRequest(
        String firstName,
        String lastName,
        List<UUID> lectureIDs
) {
}
