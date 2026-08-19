package com.pse.moderation.repository;



import java.util.List;
import java.util.UUID;

import com.pse.moderation.model.Warning;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;


public interface WarningRepository extends JpaRepository<Warning, UUID> {


    List<Warning> findByStudent(Student student);

    List<Warning> findByStudentOrderByCreatedAtDesc(Student student);

    long countByStudent(Student student);

    /**
     * Warning counts for every student that has at least one, as
     * {@code [studentId, count]} rows. Lets the user list resolve its counters in
     * one query instead of one per row.
     */
    @Query("""
        SELECT warning.student.id, COUNT(warning)
        FROM Warning warning
        GROUP BY warning.student.id
    """)
    List<Object[]> countGroupedByStudent();

}
