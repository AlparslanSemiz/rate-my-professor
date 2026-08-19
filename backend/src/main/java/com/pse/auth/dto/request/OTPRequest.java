package com.pse.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OTPRequest(@NotBlank String email) {}

