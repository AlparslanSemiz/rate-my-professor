package com.pse.repositories;



import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.auth.OneTimePassword;

public interface OneTimePasswordRepository extends JpaRepository<OneTimePassword, Integer> {

    /**
     * used for "validateOTP"
     */
    Optional<OneTimePassword> findByEmailAndValueAndUsedFalseAndExpiresAtAfter(
        String email,
        String value,
        LocalDateTime now
    );
}