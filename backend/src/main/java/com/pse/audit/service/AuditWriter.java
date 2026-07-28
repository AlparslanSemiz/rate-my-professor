package com.pse.audit.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditActorType;
import com.pse.audit.model.AuditLog;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.repository.AuditLogRepository;
import com.pse.moderation.model.Admin;
import com.pse.user.model.Student;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditWriter {

    private final AuditLogRepository repository;

    public AuditWriter(AuditLogRepository repository) {
        this.repository = repository;
    }

    public AuditLog write(
            Admin actor,
            AuditAction action,
            AuditTargetType targetType,
            UUID targetId,
            String targetLabel,
            Map<String, Object> changes,
            Map<String, Object> metadata
    ) {
        Student student = actor.getStudent();
        AuditLog log = new AuditLog();
        log.setActorType(AuditActorType.ADMIN);
        log.setActorId(student.getId());
        log.setActorName(student.getUsername());
        log.setActorEmail(student.getKitEmail());
        log.setActorRole("ADMIN");
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
