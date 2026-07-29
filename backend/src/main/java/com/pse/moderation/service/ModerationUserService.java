package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.AuthService;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.dto.response.WarningIssuerResponse;
import com.pse.moderation.dto.response.WarningResponse;
import com.pse.moderation.model.Admin;
import com.pse.moderation.model.Warning;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.NotificationType;
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.UtcDates;
import com.pse.social.model.Notification;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.NotificationRepository;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ModerationUserService {

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final WarningRepository warningRepository;
    private final CommentReportRepository commentReportRepository;
    private final NotificationRepository notificationRepository;
    private final TokenRepository tokenRepository;
    private final AuditWriter auditWriter;
    private final AuthService authService;
    private final Clock clock;

    public ModerationUserService(
            StudentRepository studentRepository,
            AdminRepository adminRepository,
            WarningRepository warningRepository,
            CommentReportRepository commentReportRepository,
            NotificationRepository notificationRepository,
            TokenRepository tokenRepository,
            AuditWriter auditWriter,
            AuthService authService,
            Clock clock
    ) {
        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.warningRepository = warningRepository;
        this.commentReportRepository = commentReportRepository;
        this.notificationRepository = notificationRepository;
        this.tokenRepository = tokenRepository;
        this.auditWriter = auditWriter;
        this.authService = authService;
        this.clock = clock;
    }

    public boolean validateAdminToken(String authHeader) {
        Student student = authService.verifyUser(authHeader);
        return student != null && adminRepository.existsByStudent(student);
    }

    public boolean verifyAdmin(Student student) {
        return adminRepository.existsByStudent(student);
    }

    @Transactional(readOnly = true)
    public UserListResponse getStudents() {
        // Three batch queries instead of three per student. The role is resolved
        // in Java rather than SQL, so it cannot be an ORDER BY and the ordering
        // has to happen here too.
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Integer> warningCounts = toCountMap(warningRepository.countGroupedByStudent());
        Map<UUID, Integer> reportCounts =
                toCountMap(commentReportRepository.countGroupedByCommentStudent());

        List<UserResponse> users = studentRepository
                .findAllByStatusNotOrderByCreatedAtDesc(UserStatus.DELETED)
                .stream()
                .map(student -> toUserResponse(
                        student,
                        adminIds.contains(student.getId()),
                        warningCounts.getOrDefault(student.getId(), 0),
                        reportCounts.getOrDefault(student.getId(), 0)
                ))
                // Administrators first, then newest joined first. The id is the
                // final tiebreaker so the order is stable across calls even when
                // two accounts share a joined timestamp.
                .sorted(Comparator
                        .comparing((UserResponse user) -> user.role() == UserRole.ADMIN ? 0 : 1)
                        .thenComparing(UserResponse::joined, Comparator.reverseOrder())
                        .thenComparing(user -> user.id().toString()))
                .toList();
        return new UserListResponse("Success", true, users);
    }

    @Transactional(readOnly = true)
    public UserResponse getStudent(UUID studentId) {
        Student student = studentRepository
                .findByIdAndStatusNot(studentId, UserStatus.DELETED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserResponse(student);
    }

    private static Map<UUID, Integer> toCountMap(List<Object[]> rows) {
        Map<UUID, Integer> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    @Transactional
    public BasicResponse deleteStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        protectAdministrator(target);

        // The audit label is built before the scrub so the record keeps the real
        // identity of who was deleted. audit_logs has no foreign key to students
        // and snapshots actor/target, so it survives this untouched.
        String label = userLabel(target);
        UserStatus before = target.getStatus();

        // Anonymize rather than delete the row: every comment, answer, vote,
        // rating, warning and report keeps a valid foreign key, so nothing is
        // left pointing at a dangling id and no discussion thread loses its
        // context. Both scrubbed values embed the UUID because username and
        // kit_email are unique columns.
        String shortId = target.getId().toString().substring(0, 8);
        target.setStatus(UserStatus.DELETED);
        target.setUsername("Deleted user " + shortId);
        target.setKitEmail("deleted-" + target.getId() + "@invalid.local");
        target.setBiography("");
        target.setBlockedReason(null);
        target.setDeletedAt(LocalDateTime.now(clock));
        studentRepository.save(target);
        revokeTokens(target);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", true, "after", false));
        changes.put("status", Map.of("before", before.name(), "after", UserStatus.DELETED.name()));
        changes.put("anonymized", Map.of("before", false, "after", true));

        auditWriter.write(
                principal.admin(),
                AuditAction.USER_DELETED,
                AuditTargetType.USER,
                target.getId(),
                label,
                changes,
                Map.of()
        );
        return new BasicResponse("Deleted user successfully", true);
    }

    @Transactional
    public BasicResponse blockStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        protectAdministrator(target);
        if (target.getStatus() == UserStatus.BLOCKED) {
            return new BasicResponse("Student blocked successfully", true);
        }

        UserStatus before = target.getStatus();
        target.setStatus(UserStatus.BLOCKED);
        target.setBlockedAt(LocalDateTime.now(clock));
        studentRepository.save(target);
        revokeTokens(target);
        auditWriter.write(
                principal.admin(),
                AuditAction.USER_BLOCKED,
                AuditTargetType.USER,
                target.getId(),
                userLabel(target),
                AuditWriter.change("status", before.name(), UserStatus.BLOCKED.name()),
                Map.of()
        );
        return new BasicResponse("Student blocked successfully", true);
    }

    @Transactional
    public BasicResponse unblockStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        protectAdministrator(target);
        if (target.getStatus() == UserStatus.ACTIVE) {
            return new BasicResponse("Student unblocked successfully", true);
        }

        UserStatus before = target.getStatus();
        target.setStatus(UserStatus.ACTIVE);
        target.setBlockedAt(null);
        target.setBlockedReason(null);
        studentRepository.save(target);
        auditWriter.write(
                principal.admin(),
                AuditAction.USER_UNBLOCKED,
                AuditTargetType.USER,
                target.getId(),
                userLabel(target),
                AuditWriter.change("status", before.name(), UserStatus.ACTIVE.name()),
                Map.of()
        );
        return new BasicResponse("Student unblocked successfully", true);
    }

    @Transactional
    public BasicResponse warnStudent(
            AuthenticatedUser principal,
            UUID studentId,
            WarningRequest request
    ) {
        String message = request.message() == null ? "" : request.message().trim();
        if (message.isEmpty() || message.length() > 2_000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Warning message is required");
        }

        Student target = findMutableStudent(studentId);
        protectAdministrator(target);
        long before = warningRepository.countByStudent(target);

        Warning warning = new Warning();
        warning.setStudent(target);
        warning.setAdmin(principal.admin());
        warning.setMessage(message);
        warningRepository.save(warning);

        // A warning the student is never told about is not a warning. This is the
        // only student-visible effect: it does not restrict anything, and the
        // account status is deliberately left untouched.
        Notification notification = new Notification();
        notification.setRecipient(target);
        notification.setType(NotificationType.WARNING);
        notification.setMessage(message);
        notificationRepository.save(notification);

        auditWriter.write(
                principal.admin(),
                AuditAction.USER_WARNING_CREATED,
                AuditTargetType.USER,
                target.getId(),
                userLabel(target),
                AuditWriter.change("warnings", before, before + 1),
                Map.of("reason", message)
        );
        return new BasicResponse("Student warned successfully", true);
    }

    @Transactional(readOnly = true)
    public WarningHistoryResponse getWarningsForStudent(UUID studentId) {
        Student target = studentRepository
                .findByIdAndStatusNot(studentId, UserStatus.DELETED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        List<WarningResponse> warnings = warningRepository
                .findByStudentOrderByCreatedAtDesc(target)
                .stream()
                .map(this::toWarningResponse)
                .toList();
        return new WarningHistoryResponse(
                "Successfully found warnings for student",
                true,
                warnings
        );
    }

    private Student findMutableStudent(UUID id) {
        Student target = studentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (target.getStatus() == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }
        return target;
    }

    private void protectAdministrator(Student target) {
        if (adminRepository.existsByStudent(target)) {
            throw new ApiException(HttpStatus.CONFLICT, "Administrator accounts cannot be modified");
        }
    }

    private void revokeTokens(Student target) {
        List<Token> tokens = tokenRepository.findByStudent(target);
        tokens.forEach(token -> token.setRevoked(true));
        tokenRepository.saveAll(tokens);
    }

    private UserResponse toUserResponse(Student student) {
        return toUserResponse(
                student,
                adminRepository.existsByStudent(student),
                Math.toIntExact(warningRepository.countByStudent(student)),
                Math.toIntExact(commentReportRepository.countByCommentStudent(student))
        );
    }

    private UserResponse toUserResponse(
            Student student,
            boolean isAdmin,
            int warnings,
            int reports
    ) {
        LocalDateTime joined = student.getCreatedAt();
        if (joined == null) {
            joined = student.getEmailVerifiedAt() == null
                    ? LocalDateTime.now(clock)
                    : student.getEmailVerifiedAt();
        }
        LocalDateTime lastOnline = student.getLastSeenAt() == null ? joined : student.getLastSeenAt();
        return new UserResponse(
                student.getId(),
                student.getUsername(),
                student.getKitEmail(),
                isAdmin ? UserRole.ADMIN : UserRole.STUDENT,
                student.getStatus(),
                UtcDates.format(joined),
                UtcDates.format(lastOnline),
                student.getBiography() == null ? "" : student.getBiography(),
                warnings,
                reports
        );
    }

    private WarningResponse toWarningResponse(Warning warning) {
        Admin issuer = warning.getAdmin();
        // createdFrom.createdAt is the moment the warning was issued. It used to
        // report when the admin account itself was provisioned, which made every
        // warning from the same admin carry an identical, unrelated timestamp.
        WarningIssuerResponse createdFrom = issuer == null
                ? null
                : new WarningIssuerResponse(
                        issuer.getStudent().getId(),
                        null,
                        UtcDates.format(warning.getCreatedAt())
                );
        return new WarningResponse(
                warning.getStudent().getId(),
                warning.getMessage(),
                UtcDates.format(warning.getCreatedAt()),
                createdFrom
        );
    }

    private String userLabel(Student student) {
        return student.getUsername() + " (" + student.getKitEmail() + ")";
    }
}
