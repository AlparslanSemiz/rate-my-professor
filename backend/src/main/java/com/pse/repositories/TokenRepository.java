package com.pse.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.auth.Token;

public interface TokenRepository extends JpaRepository<Token, UUID> {

    Optional<Token> findByValueAndRevokedFalseAndExpiresAtAfter(
            String value,
            LocalDateTime now
    );

    List<Token> findByEmail(String email);
}