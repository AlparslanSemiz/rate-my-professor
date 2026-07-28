package com.pse.auth.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import com.pse.auth.model.Token;
import com.pse.user.model.Student;

public interface TokenRepository extends JpaRepository<Token, UUID> {

    @EntityGraph(attributePaths = "student")
    Optional<Token> findByHashAndRevokedFalseAndExpiresAtAfter(
            String hash,
            LocalDateTime now
    );

    @EntityGraph(attributePaths = "student")
    Optional<Token> findByLegacyValueAndRevokedFalseAndExpiresAtAfter(
            String legacyValue,
            LocalDateTime now
    );

    List<Token> findByEmail(String email);

    List<Token> findByStudent(Student student);

    List<Token> findByStudentOrEmail(Student student, String email);
}
