package com.pse.moderation.controller;

import com.pse.shared.dto.BasicResponse;
import com.pse.moderation.dto.request.UserUpdateRequest;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.service.ModerationUserService;
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

    private final ModerationUserService service;

    public ModerationUserController(ModerationUserService service) {
        this.service = service;
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
        return service.getStudents(limit, cursor, q, status, role, sort);
    }

    @GetMapping("/{id}")
    public UserResponse getStudent(@PathVariable UUID id) {
        return service.getStudent(id);
    }

    @PatchMapping("/{id}")
    public BasicResponse updateStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody UserUpdateRequest request
    ) {
        return service.updateStudent(principal, id, request);
    }

    @DeleteMapping("/{id}")
    public BasicResponse deleteStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return service.deleteStudent(principal, id);
    }

    @PatchMapping("/{id}/block")
    public BasicResponse blockStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return service.blockStudent(principal, id);
    }

    @PatchMapping("/{id}/unblock")
    public BasicResponse unblockStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return service.unblockStudent(principal, id);
    }

    @PostMapping("/{id}/warnings")
    public BasicResponse warnStudent(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody WarningRequest request
    ) {
        return service.warnStudent(principal, id, request);
    }

    @GetMapping("/{id}/warnings")
    public WarningHistoryResponse getWarningsForStudent(@PathVariable UUID id) {
        return service.getWarningsForStudent(id);
    }

    @PatchMapping("/{id}/warnings/{warningId}")
    public BasicResponse updateWarning(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @PathVariable UUID warningId,
            @RequestBody WarningRequest request
    ) {
        return service.updateWarning(principal, id, warningId, request);
    }

    @DeleteMapping("/{id}/warnings/{warningId}")
    public BasicResponse deleteWarning(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @PathVariable UUID warningId
    ) {
        return service.deleteWarning(principal, id, warningId);
    }
}
