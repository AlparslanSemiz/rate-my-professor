package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.LectureUpdateRequest;
import com.pse.moderation.dto.request.ProfessorUpdateRequest;
import com.pse.moderation.service.ModerationCatalogService;
import com.pse.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Shares the {@code /data} base path with the public catalogue reads. The reads stay
 * public; these writes are admin-only, separated by method in the security rules.
 */
@RestController
@RequestMapping("/data")
public class ModerationCatalogController {

    private final ModerationCatalogService service;

    public ModerationCatalogController(ModerationCatalogService service) {
        this.service = service;
    }

    @PatchMapping("/lectures/{id}")
    public BasicResponse updateLecture(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody LectureUpdateRequest request
    ) {
        return service.updateLecture(principal, id, request);
    }

    @DeleteMapping("/lectures/{id}")
    public BasicResponse deleteLecture(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return service.deleteLecture(principal, id);
    }

    @PatchMapping("/professor/{id}")
    public BasicResponse updateProfessor(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id,
            @RequestBody ProfessorUpdateRequest request
    ) {
        return service.updateProfessor(principal, id, request);
    }

    @DeleteMapping("/professor/{id}")
    public BasicResponse deleteProfessor(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return service.deleteProfessor(principal, id);
    }
}
