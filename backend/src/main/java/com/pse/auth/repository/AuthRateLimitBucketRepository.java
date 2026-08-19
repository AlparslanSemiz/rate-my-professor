package com.pse.auth.repository;

import com.pse.auth.model.AuthRateLimitBucket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AuthRateLimitBucketRepository extends JpaRepository<AuthRateLimitBucket, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthRateLimitBucket> findByOperationAndSubjectHash(String operation, String subjectHash);

    @Modifying
    void deleteByOperationAndSubjectHash(String operation, String subjectHash);

    @Modifying
    @Query("delete from AuthRateLimitBucket bucket where bucket.windowStartedAt < :cutoff")
    int deleteExpired(@Param("cutoff") LocalDateTime cutoff);
}
