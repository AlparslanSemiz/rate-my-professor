package com.pse.audit.controller;

import com.pse.audit.dto.AuditLogPageResponse;
import com.pse.audit.dto.AuditMetaResponse;
import com.pse.audit.model.AuditActionScope;
import com.pse.audit.service.AuditLogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The administrative record: what admins did through the panel. Student activity and
 * refused requests live in the same table but are served by {@code /activity-logs}.
 */
@RestController
@RequestMapping("/audit-logs")
public class AuditLogController {

    private final AuditLogService service;

    public AuditLogController(AuditLogService service) {
        this.service = service;
    }

    @GetMapping
    public AuditLogPageResponse getLogs(
            @RequestParam(required = false) String limit,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String actorType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return service.getLogs(
                AuditActionScope.ADMINISTRATIVE,
                limit,
                cursor,
                q,
                actorId,
                actorType,
                action,
                targetType,
                from,
                to
        );
    }

    @GetMapping("/meta")
    public AuditMetaResponse getMeta() {
        return service.getMeta(AuditActionScope.ADMINISTRATIVE);
    }
}
