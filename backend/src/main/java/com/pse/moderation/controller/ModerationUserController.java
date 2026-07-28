package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/users")
public class ModerationUserController {

    private final ModerationUserService service;

    public ModerationUserController(ModerationUserService service) {
        this.service = service;
    }

    @GetMapping
    public UserListResponse getStudents() {
        return service.getStudents();
    }

    @GetMapping("/{id}")
    public UserResponse getStudent(@PathVariable UUID id) {
        return service.getStudent(id);
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
}
