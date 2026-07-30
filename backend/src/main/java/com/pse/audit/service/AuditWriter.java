package com.pse.audit.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditActorType;
import com.pse.audit.model.AuditLog;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.repository.AuditLogRepository;
import com.pse.moderation.model.Admin;
import com.pse.user.model.Student;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditWriter {

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String STUDENT_ROLE = "STUDENT";

    private final AuditLogRepository repository;

    public AuditWriter(AuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Records an administrative action. Joins the caller's transaction on purpose, so a
     * failing audit insert rolls the domain mutation back with it.
     */
    public AuditLog write(
            Admin actor,
            AuditAction action,
            AuditTargetType targetType,
            UUID targetId,
            String targetLabel,
            Map<String, Object> changes,
            Map<String, Object> metadata
    ) {
        return persist(
                AuditActorType.ADMIN,
                actor.getStudent(),
                ADMIN_ROLE,
                action,
                targetType,
                targetId,
                targetLabel,
                changes,
                metadata
        );
    }

    /**
     * Records something a user did in the student app. Joins the caller's transaction
     * for the same reason {@link #write} does.
     */
    public AuditLog writeStudentAction(
            Student actor,
            AuditAction action,
            AuditTargetType targetType,
            UUID targetId,
            String targetLabel,
            Map<String, Object> metadata
    ) {
        return persist(
                AuditActorType.USER,
                actor,
                STUDENT_ROLE,
                action,
                targetType,
                targetId,
                targetLabel,
                Map.of(),
                metadata
        );
    }

    /**
     * Records a refused request in its own transaction. The caller is about to answer
     * with an error and roll its own work back, which would take a record written in
     * the caller's transaction with it.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog writeRefusal(
            Student actor,
            boolean admin,
            AuditAction action,
            AuditTargetType targetType,
            UUID targetId,
            String targetLabel,
            Map<String, Object> metadata
    ) {
        return persist(
                admin ? AuditActorType.ADMIN : AuditActorType.USER,
                actor,
                admin ? ADMIN_ROLE : STUDENT_ROLE,
                action,
                targetType,
                targetId,
                targetLabel,
                Map.of(),
                metadata
        );
    }

    private AuditLog persist(
            AuditActorType actorType,
            Student actor,
            String actorRole,
            AuditAction action,
            AuditTargetType targetType,
            UUID targetId,
            String targetLabel,
            Map<String, Object> changes,
            Map<String, Object> metadata
    ) {
        AuditLog log = new AuditLog();
        log.setActorType(actorType);
        log.setActorId(actor.getId());
        log.setActorName(actor.getUsername());
        log.setActorEmail(actor.getKitEmail());
        log.setActorRole(actorRole);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTargetLabel(targetLabel);
        log.setChanges(changes == null ? new LinkedHashMap<>() : new LinkedHashMap<>(changes));
        log.setMetadata(metadata == null ? new LinkedHashMap<>() : new LinkedHashMap<>(metadata));
        return repository.saveAndFlush(log);
    }

    public static Map<String, Object> change(String field, Object before, Object after) {
        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put(field, Map.of("before", before, "after", after));
        return changes;
    }

    public static Map<String, Object> nullableChange(String field, Object before, Object after) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("before", before);
        value.put("after", after);
        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put(field, value);
        return changes;
    }
}
