package com.pse.moderation.repository;


import java.util.Optional;
import java.util.UUID;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pse.moderation.model.Admin;
import com.pse.user.model.Student;

public interface AdminRepository extends JpaRepository<Admin, UUID> {

    boolean existsByStudent(Student student);

    Optional<Admin> findByStudent(Student student);

    /** Student ids of every administrator, for resolving roles without a query per row. */
    @Query("SELECT admin.student.id FROM Admin admin")
    List<UUID> findAllAdminStudentIds();

    /**
     * Whether anything still points at this administrator: a warning it issued, or a
     * report it reviewed. Those are foreign keys to the admin row, so deleting the row
     * — which is what demoting an administrator does — is refused by the database.
     *
     * <p>Kept next to the repository because it enumerates every table referencing
     * {@code Admin}: a new such reference has to be added here as well.
     */
    @Query("""
        SELECT COUNT(admin) > 0 FROM Admin admin
        WHERE admin = :admin
          AND (EXISTS (SELECT warning FROM Warning warning WHERE warning.admin = admin)
            OR EXISTS (SELECT report FROM CommentReport report WHERE report.reviewedBy = admin)
            OR EXISTS (SELECT report FROM AnswerReport report WHERE report.reviewedBy = admin)
            OR EXISTS (SELECT report FROM BugReport report WHERE report.resolvedBy = admin))
    """)
    boolean hasModerationHistory(@Param("admin") Admin admin);

}