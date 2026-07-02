package com.pse.professor.dto.response;


public record ProfessorDetailResponse(
        String message,
        boolean success,
        ProfessorResponse professor
) {}
