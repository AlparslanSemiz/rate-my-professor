package com.pse.audit.revert;

import com.pse.audit.model.AuditTargetType;
import com.pse.moderation.dto.request.UserUpdateRequest;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.service.ModerationUserService;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Undoes user field edits — {@code USER_UPDATED}, and the status flips that
 * {@code USER_BLOCKED} and {@code USER_UNBLOCKED} record.
 */
@Component
public class UserRevertHandler implements AuditRevertHandler {

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final ModerationUserService userService;

    public UserRevertHandler(
            StudentRepository studentRepository,
            AdminRepository adminRepository,
            ModerationUserService userService
    ) {
        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.userService = userService;
    }

    @Override
    public AuditTargetType targetType() {
        return AuditTargetType.USER;
    }

    @Override
    public Map<UUID, Map<String, Object>> currentValues(Collection<UUID> targetIds) {
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Map<String, Object>> values = new HashMap<>();
        for (Student student : studentRepository.findAllById(targetIds)) {
            // A soft-deleted account is anonymised: its recorded username and address are
            // already gone, so it reads as a missing target rather than a stale one.
            if (student.getStatus() == UserStatus.DELETED) {
                continue;
            }
            Map<String, Object> current = new LinkedHashMap<>();
            current.put("username", student.getUsername());
            current.put("kitEmail", student.getKitEmail());
            current.put("biography", student.getBiography() == null ? "" : student.getBiography());
            current.put("status", student.getStatus().name());
            current.put("role", adminIds.contains(student.getId())
                    ? UserRole.ADMIN.name()
                    : UserRole.STUDENT.name());
            current.put("credibilityScore", student.getCredibilityScore());
            values.put(student.getId(), current);
        }
        return values;
    }

    @Override
    public void applyInverse(AuthenticatedUser principal, UUID targetId, Map<String, Object> before) {
        userService.updateStudent(principal, targetId, new UserUpdateRequest(
                RevertValues.asString(before, "username"),
                RevertValues.asString(before, "kitEmail"),
                RevertValues.asString(before, "biography"),
                RevertValues.asEnum(before, "status", UserStatus.class),
                RevertValues.asEnum(before, "role", UserRole.class),
                RevertValues.asInteger(before, "credibilityScore")
        ));
    }
}
