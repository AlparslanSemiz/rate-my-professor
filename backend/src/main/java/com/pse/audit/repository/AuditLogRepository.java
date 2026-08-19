package com.pse.audit.repository;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

    /**
     * The newest recorded event, using the same ordering the paged read uses. This is
     * what tells the system status page whether writes are reaching the database.
     */
    Optional<AuditLog> findFirstByOrderByCreatedAtDescIdDesc();

    /**
     * Actor snapshots that appear in the given actions, most recently active first.
     *
     * <p>A projection rather than a list of entities: this feeds a filter dropdown, and
     * loading every matching event to build it does not scale once the log holds student
     * activity. An actor renamed between two events yields one row per snapshot, so the
     * caller still has to keep the first row per id.
     */
    @Query("""
        SELECT log.actorId, log.actorName, log.actorEmail, log.actorRole
        FROM AuditLog log
        WHERE log.action IN :actions
        GROUP BY log.actorId, log.actorName, log.actorEmail, log.actorRole
        ORDER BY MAX(log.createdAt) DESC
    """)
    List<Object[]> findActorSnapshots(
            @Param("actions") Collection<AuditAction> actions,
            Pageable pageable
    );
}
