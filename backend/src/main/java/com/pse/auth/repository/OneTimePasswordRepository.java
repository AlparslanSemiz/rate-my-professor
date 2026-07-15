package com.pse.auth.repository;



import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.auth.model.OneTimePassword;

public interface OneTimePasswordRepository extends JpaRepository<OneTimePassword, Integer> {

   
    List<OneTimePassword> findByEmailAndUsedFalseAndExpiresAtAfter(
            String email,
            LocalDateTime expiresAt
    );
}