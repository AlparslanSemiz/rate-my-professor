package com.pse.audit.revert;

import com.pse.audit.model.AuditTargetType;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.model.Warning;
import com.pse.moderation.repository.WarningRepository;
import com.pse.moderation.service.ModerationUserService;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.error.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Undoes a correction to a warning's text. Only {@code USER_WARNING_UPDATED} is revertible;
 * a withdrawn warning is gone, and its text lives only in the entry that removed it.
 */
@Component
public class WarningRevertHandler implements AuditRevertHandler {

    private final WarningRepository warningRepository;
    private final ModerationUserService userService;

    public WarningRevertHandler(
            WarningRepository warningRepository,
            ModerationUserService userService
    ) {
        this.warningRepository = warningRepository;
        this.userService = userService;
    }

    @Override
    public AuditTargetType targetType() {
        return AuditTargetType.WARNING;
    }

    @Override
    public Map<UUID, Map<String, Object>> currentValues(Collection<UUID> targetIds) {
        Map<UUID, Map<String, Object>> values = new HashMap<>();
        for (Warning warning : warningRepository.findAllById(targetIds)) {
            Map<String, Object> current = new LinkedHashMap<>();
            current.put("message", warning.getMessage());
            values.put(warning.getId(), current);
        }
        return values;
    }

    @Override
    public void applyInverse(AuthenticatedUser principal, UUID targetId, Map<String, Object> before) {
        // A warning is addressed as a sub-resource of the student it was issued to, so the
        // owning student has to be resolved before the correction can be applied.
        Warning warning = warningRepository.findById(targetId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Warning not found"));
        userService.updateWarning(
                principal,
                warning.getStudent().getId(),
                targetId,
                new WarningRequest(RevertValues.asString(before, "message"))
        );
    }
}
