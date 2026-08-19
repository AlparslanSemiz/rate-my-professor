package com.pse.social.repository;



import com.pse.shared.enums.ReportStatus;
import com.pse.social.model.CommentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import com.pse.user.model.Student;


public interface CommentReportRepository extends JpaRepository<CommentReport, UUID> {

    long countByCommentStudent(Student student);

    long countByStatus(ReportStatus status);

    /**
     * Reports received per comment author, as {@code [studentId, count]} rows.
     * The per-row equivalent of {@link #countByCommentStudent(Student)}.
     */
    @Query("""
        SELECT report.comment.student.id, COUNT(report)
        FROM CommentReport report
        GROUP BY report.comment.student.id
    """)
    List<Object[]> countGroupedByCommentStudent();

    /** Reports per comment, as {@code [commentId, count]} rows. */
    @Query("""
        SELECT report.comment.id, COUNT(report)
        FROM CommentReport report
        GROUP BY report.comment.id
    """)
    List<Object[]> countGroupedByComment();

    @EntityGraph(attributePaths = {"comment", "comment.student", "comment.lecture", "reporter"})
    List<CommentReport> findAllByOrderByCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"comment", "comment.student", "comment.lecture", "reporter"})
    @Query("select report from CommentReport report where report.id = :id")
    Optional<CommentReport> findByIdForUpdate(@Param("id") UUID id);
}
