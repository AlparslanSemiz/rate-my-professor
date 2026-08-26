package com.pse.auth.dto.request;


import jakarta.validation.constraints.NotBlank;

public record ValidateCredentialsRequest(

        @NotBlank String email

) {}