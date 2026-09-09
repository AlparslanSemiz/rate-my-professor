package com.pse.user.repository;

import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pse.shared.enums.UserStatus;
import com.pse.user.model.Student;

/**
 * Acts an direct interface to the
 */
public interface StudentRepository
        extends JpaRepository<Student, UUID>, JpaSpecificationExecutor<Student> {

    /**
     * Finds the User by their KIT-Email address.
     * @param kitEmail e.g. uabcd@student.kit.edu
     * @return the User referenced to that email (if found)
     */
    Optional<Student> findByKitEmail(String kitEmail);

    boolean existsByUsername(String username);

    long countByStatusNot(UserStatus status);

    long countByStatus(UserStatus status);

    Optional<Student> findByIdAndStatusNot(UUID id, UserStatus status);


    //TODO: Is Query part needed?
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select student from Student student where student.id = :id")
    Optional<Student> findByIdForUpdate(@Param("id") UUID id);



}
