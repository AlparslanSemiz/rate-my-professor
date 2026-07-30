package com.pse.moderation.controller;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.service.ModerationContentService;
import com.pse.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Sits on the same base path as the public {@code RatingController}: the reads there stay
 * public, this write is admin-only, and the security rules separate them by method.
 */
@RestController
@RequestMapping("/ratings")
public class ModerationRatingController {

    private final ModerationContentService contentService;

    public ModerationRatingController(ModerationContentService contentService) {
        this.contentService = contentService;
    }

    @DeleteMapping("/{id}")
    public BasicResponse deleteRating(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable UUID id
    ) {
        return contentService.deleteRating(principal, id);
    }
}
