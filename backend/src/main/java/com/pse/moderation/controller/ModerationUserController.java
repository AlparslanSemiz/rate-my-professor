package com.pse.moderation.controller;

import com.pse.shared.dto.BasicResponse;
import com.pse.moderation.dto.request.UserUpdateRequest;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.service.user.StudentLifecycleService;
import com.pse.moderation.service.user.StudentProfileService;
import com.pse.moderation.service.user.UserDirectoryService;
import com.pse.moderation.service.user.WarningService;
import com.pse.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping({"/admin/users", "/users"})
public class ModerationUserController {

    private final UserDirectoryService directory;
    private final StudentProfileService profiles;
    private final StudentLifecycleService lifecycle;
    private final WarningService warnings;

    public ModerationUserController(
            UserDirectoryService directory,
            StudentProfileService profiles,
            StudentLifecycleService lifecycle,
            WarningService warnings
    ) {
        this.directory = directory;
        this.profiles = profiles;
        this.lifecycle = lifecycle;
        this.warnings = warnings;
    }

    /**
     * Every parameter is declared as a String and parsed in the service, the same way
     * {@code AuditLogController} does it, so a bad value answers with a specific message
     * instead of Spring's generic type-mismatch failure.
     */
    @GetMapping
    public UserListResponse getStudents(
            @RequestParam(required = false) String limit,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String sort
    ) {
        return directory.getStudents(limit, cursor, q, status, role, sort);
    }

    @GetMapping("/{id}")
    public UserResponse getStudent(@PathVariable UUID id) {
        return directory.getStudent(id);
    }

    @PatchMapping("/{id}")
    public BasicResponse updateStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody UserUpdateRequest request
    ) {
        return profiles.updateStudent(principal, id, request);
    }

    @DeleteMapping("/{id}")
    public BasicResponse deleteStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return lifecycle.deleteStudent(principal, id);
    }

    @PatchMapping("/{id}/block")
    public BasicResponse blockStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return lifecycle.blockStudent(principal, id);
    }

    @PatchMapping("/{id}/unblock")
    public BasicResponse unblockStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return lifecycle.unblockStudent(principal, id);
    }

    @PostMapping("/{id}/warnings")
    public BasicResponse warnStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody WarningRequest request
    ) {
        return warnings.warnStudent(principal, id, request);
    }

    @GetMapping("/{id}/warnings")
    public WarningHistoryResponse getWarningsForStudent(@PathVariable UUID id) {
        return warnings.getWarningsForStudent(id);
    }

    @PatchMapping("/{id}/warnings/{warningId}")
    public BasicResponse updateWarning(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @PathVariable UUID warningId,
            @RequestBody WarningRequest request
    ) {
        return warnings.updateWarning(principal, id, warningId, request);
    }

    @DeleteMapping("/{id}/warnings/{warningId}")
    public BasicResponse deleteWarning(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @PathVariable UUID warningId
    ) {
        return warnings.deleteWarning(principal, id, warningId);
    }
}
