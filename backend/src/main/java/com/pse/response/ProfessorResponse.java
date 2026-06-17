package com.pse.response;

import java.math.BigDecimal;
import java.util.UUID;


public record ProfessorResponse(
        UUID id,
        String firstName,
        String lastName,
        BigDecimal averageRating,
        int ratingCount
) {}