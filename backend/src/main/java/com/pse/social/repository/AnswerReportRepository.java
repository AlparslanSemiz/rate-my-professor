package com.pse.social.repository;


import com.pse.shared.enums.ReportStatus;
import com.pse.social.model.AnswerReport;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface AnswerReportRepository extends JpaRepository<AnswerReport, UUID> {

    @EntityGraph(attributePaths = {
            "answer", "answer.student", "answer.comment", "answer.comment.lecture", "reporter"
    })
    List<AnswerReport> findAllByOrderByCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {
            "answer", "answer.student", "answer.comment", "answer.comment.lecture", "reporter"
    })
    @Query("select report from AnswerReport report where report.id = :id")
    Optional<AnswerReport> findByIdForUpdate(@Param("id") UUID id);

    long countByStatus(ReportStatus status);

    /** Reports per answer, as {@code [answerId, count]} rows. */
    @Query("""
        SELECT report.answer.id, COUNT(report)
        FROM AnswerReport report
        GROUP BY report.answer.id
    """)
    List<Object[]> countGroupedByAnswer();
}
