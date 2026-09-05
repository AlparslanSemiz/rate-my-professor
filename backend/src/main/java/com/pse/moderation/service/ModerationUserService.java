package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.model.Token;
import com.pse.auth.repository.TokenRepository;
import com.pse.auth.service.AdminSuperuserPolicy;
import com.pse.auth.service.AuthService;
import com.pse.moderation.dto.request.UserUpdateRequest;
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
import com.pse.shared.util.KeysetCursorCodec;
import com.pse.shared.util.SqlLike;
import com.pse.shared.util.UtcDates;
import com.pse.social.model.Notification;
import com.pse.social.repository.CommentReportRepository;
import com.pse.social.repository.NotificationRepository;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class ModerationUserService {

    private static final Pattern KIT_EMAIL =
            Pattern.compile("^[A-Z0-9._%+-]+@student\\.kit\\.edu$", Pattern.CASE_INSENSITIVE);

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final WarningRepository warningRepository;
    private final CommentReportRepository commentReportRepository;
    private final NotificationRepository notificationRepository;
    private final TokenRepository tokenRepository;
    private final AuditWriter auditWriter;
    private final AuthService authService;
    private final AdminSuperuserPolicy superuserPolicy;
    private final KeysetCursorCodec cursorCodec;
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
            AdminSuperuserPolicy superuserPolicy,
            KeysetCursorCodec cursorCodec,
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
        this.superuserPolicy = superuserPolicy;
        this.cursorCodec = cursorCodec;
        this.clock = clock;
    }

    public boolean validateAdminToken(String authHeader) {
        Student student = authService.verifyUser(authHeader);
        return student != null && adminRepository.existsByStudent(student);
    }

    public boolean verifyAdmin(Student student) {
        return adminRepository.existsByStudent(student);
    }

    /**
     * Lists users, with filtering always available and pagination opt-in.
     *
     * <p>Passing no {@code limit} returns every matching user and a {@code null} cursor,
     * which is what this endpoint has always done — a caller that has not been taught to
     * follow cursors is not silently truncated to one page. Passing {@code limit} switches
     * on keyset pagination.
     *
     * <p>The two modes order differently, and they have to. The unparameterised listing puts
     * administrators first and then newest-joined, an ordering computed in Java because role
     * is not a column and so cannot be an ORDER BY. Keyset pagination needs an ordering the
     * database can express and resume from, so a paginated read orders strictly by
     * {@code (createdAt, id)} — the "newest first" the panel asked for.
     */
    @Transactional(readOnly = true)
    public UserListResponse getStudents(
            String rawLimit,
            String rawCursor,
            String q,
            String rawStatus,
            String rawRole,
            String rawSort
    ) {
        Integer limit = parseUserLimit(rawLimit);
        UserStatus status = parseStatusFilter(rawStatus);
        UserRole role = parseUserRole(rawRole);
        boolean newestFirst = parseNewestFirst(rawSort);
        boolean hasCursor = rawCursor != null && !rawCursor.isBlank();
        // A cursor with no limit has no page size to resume with. Answering it by returning
        // everything from that point would quietly ignore half of what was asked. Checked
        // before the cursor is decoded, because how the request is formed is the more
        // fundamental complaint than what the cursor happens to contain.
        if (hasCursor && limit == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A cursor requires a limit");
        }
        KeysetCursorCodec.Cursor cursor = hasCursor
                ? cursorCodec.decode(rawCursor, "Invalid user cursor")
                : null;
        String search = q == null ? "" : q.trim();
        if (search.length() > 200) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User search is too long");
        }

        // Three batch queries instead of three per student.
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Integer> warningCounts = toCountMap(warningRepository.countGroupedByStudent());
        Map<UUID, Integer> reportCounts =
                toCountMap(commentReportRepository.countGroupedByCommentStudent());

        Specification<Student> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            // Soft-deleted accounts are anonymised and are never listed, whatever else was
            // asked for. Returning them would over-report the size of the platform.
            predicates.add(builder.notEqual(root.get("status"), UserStatus.DELETED));
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (role != null) {
                predicates.add(rolePredicate(builder, root, adminIds, role));
            }
            if (!search.isEmpty()) {
                String pattern = "%" + SqlLike.escape(search.toLowerCase(Locale.ROOT)) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("username")), pattern, SqlLike.ESCAPE),
                        builder.like(builder.lower(root.get("kitEmail")), pattern, SqlLike.ESCAPE)
                ));
            }
            if (cursor != null) {
                predicates.add(cursorPredicate(builder, root, cursor, newestFirst));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };

        if (limit == null) {
            List<UserResponse> users = studentRepository.findAll(specification).stream()
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
            return new UserListResponse("Success", true, users, null);
        }

        Sort.Direction direction = newestFirst ? Sort.Direction.DESC : Sort.Direction.ASC;
        // One row more than asked for: its presence is what says there is a next page,
        // without a second count query that could disagree with this one.
        List<Student> fetched = studentRepository.findAll(
                specification,
                PageRequest.of(
                        0,
                        limit + 1,
                        Sort.by(
                                new Sort.Order(direction, "createdAt"),
                                new Sort.Order(direction, "id")
                        )
                )
        ).getContent();
        boolean hasNext = fetched.size() > limit;
        List<Student> page = hasNext ? fetched.subList(0, limit) : fetched;
        String nextCursor = hasNext && !page.isEmpty()
                ? cursorCodec.encode(page.getLast().getCreatedAt(), page.getLast().getId())
                : null;

        List<UserResponse> users = page.stream()
                .map(student -> toUserResponse(
                        student,
                        adminIds.contains(student.getId()),
                        warningCounts.getOrDefault(student.getId(), 0),
                        reportCounts.getOrDefault(student.getId(), 0)
                ))
                .toList();
        return new UserListResponse("Success", true, users, nextCursor);
    }

    /**
     * Role is membership of the {@code admins} table rather than a column on the student, so
     * it filters as an id set. The empty set still has to produce a valid predicate:
     * {@code IN ()} is not legal SQL, so both degenerate cases are answered directly.
     */
    private static Predicate rolePredicate(
            CriteriaBuilder builder,
            Root<Student> root,
            Set<UUID> adminIds,
            UserRole role
    ) {
        if (adminIds.isEmpty()) {
            return role == UserRole.ADMIN ? builder.disjunction() : builder.conjunction();
        }
        Predicate isAdmin = root.get("id").in(adminIds);
        return role == UserRole.ADMIN ? isAdmin : builder.not(isAdmin);
    }

    /** Resumes the {@code (createdAt, id)} ordering strictly after the cursor's row. */
    private static Predicate cursorPredicate(
            CriteriaBuilder builder,
            Root<Student> root,
            KeysetCursorCodec.Cursor cursor,
            boolean newestFirst
    ) {
        LocalDateTime at = cursor.createdAtLocal();
        if (newestFirst) {
            return builder.or(
                    builder.lessThan(root.get("createdAt"), at),
                    builder.and(
                            builder.equal(root.get("createdAt"), at),
                            builder.lessThan(root.get("id"), cursor.id())
                    )
            );
        }
        return builder.or(
                builder.greaterThan(root.get("createdAt"), at),
                builder.and(
                        builder.equal(root.get("createdAt"), at),
                        builder.greaterThan(root.get("id"), cursor.id())
                )
        );
    }

    /** Absent means "do not paginate", which is not the same as a default page size. */
    private static Integer parseUserLimit(String rawLimit) {
        if (rawLimit == null || rawLimit.isBlank()) {
            return null;
        }
        int limit;
        try {
            limit = Integer.parseInt(rawLimit.trim());
        } catch (NumberFormatException exception) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "Limit must be an integer between 1 and 100");
        }
        if (limit < 1 || limit > 100) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "Limit must be an integer between 1 and 100");
        }
        return limit;
    }

    private static UserStatus parseStatusFilter(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return null;
        }
        UserStatus status;
        try {
            status = UserStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user status");
        }
        // Filtering for DELETED can only ever return nothing, because deleted accounts are
        // excluded unconditionally. An empty page would read as "no deleted accounts exist".
        if (status == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Deleted users are not listed");
        }
        return status;
    }

    private static UserRole parseUserRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return null;
        }
        try {
            return UserRole.valueOf(rawRole.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user role");
        }
    }

    private static boolean parseNewestFirst(String rawSort) {
        if (rawSort == null || rawSort.isBlank() || rawSort.trim().equalsIgnoreCase("newest")) {
            return true;
        }
        if (rawSort.trim().equalsIgnoreCase("oldest")) {
            return false;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid user sort");
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

    /**
     * Edits a user's own fields. Everything the panel shows about an account is
     * changeable here so a wrong name, a typo'd address or a stale biography can simply
     * be corrected.
     *
     * <p>Two guards, both about not locking anyone out: an admin cannot change its own
     * status or role, and an admin account's status is protected the same way
     * block/unblock/delete protect it. Changing the address invalidates the account's
     * sessions, because the address is the login identity.
     */
    @Transactional
    public BasicResponse updateStudent(
            AuthenticatedUser principal,
            UUID studentId,
            UserUpdateRequest request
    ) {
        if (request == null
                || (request.username() == null
                && request.kitEmail() == null
                && request.biography() == null
                && request.status() == null
                && request.role() == null
                && request.credibilityScore() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No update supplied");
        }

        Student target = findMutableStudent(studentId);
        boolean targetIsAdmin = adminRepository.existsByStudent(target);
        boolean targetIsSelf = target.getId().equals(principal.student().getId());
        boolean targetIsElevated = superuserPolicy.isSuperuser(target.getKitEmail());
        boolean callerIsElevated = isElevated(principal);
        String label = userLabel(target);
        Map<String, Object> changes = new LinkedHashMap<>();

        if (request.username() != null) {
            String username = request.username().trim();
            if (username.isEmpty() || username.length() > 100) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid username");
            }
            if (!username.equals(target.getUsername())) {
                if (studentRepository.existsByUsername(username)) {
                    throw new ApiException(HttpStatus.CONFLICT, "Username is already taken");
                }
                changes.put("username", change(target.getUsername(), username));
                target.setUsername(username);
            }
        }

        boolean addressChanged = false;
        if (request.kitEmail() != null) {
            String email = normalizeKitEmail(request.kitEmail());
            if (!email.equals(target.getKitEmail())) {
                // Elevation is keyed on the address, so moving one is how an elevated
                // account would be taken over: free the address with one edit, claim it
                // with the next. Not editable through this endpoint by anyone.
                if (targetIsElevated) {
                    throw new ApiException(
                            HttpStatus.CONFLICT,
                            "The address of an elevated administrator cannot be changed"
                    );
                }
                if (targetIsAdmin && !callerIsElevated) {
                    throw new ApiException(
                            HttpStatus.CONFLICT,
                            "Administrator accounts cannot be modified"
                    );
                }
                if (studentRepository.findByKitEmail(email).isPresent()) {
                    throw new ApiException(HttpStatus.CONFLICT, "Email is already taken");
                }
                changes.put("kitEmail", change(target.getKitEmail(), email));
                target.setKitEmail(email);
                addressChanged = true;
            }
        }

        if (request.biography() != null) {
            String biography = request.biography().trim();
            if (biography.length() > 2_000) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Biography is too long");
            }
            String before = target.getBiography() == null ? "" : target.getBiography();
            if (!biography.equals(before)) {
                changes.put("biography", change(before, biography));
                target.setBiography(biography);
            }
        }

        if (request.credibilityScore() != null
                && request.credibilityScore() != target.getCredibilityScore()) {
            changes.put("credibilityScore",
                    change(target.getCredibilityScore(), request.credibilityScore()));
            target.setCredibilityScore(request.credibilityScore());
        }

        boolean sessionsRevoked = addressChanged;
        if (request.status() != null && request.status() != target.getStatus()) {
            if (request.status() == UserStatus.DELETED) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Use DELETE /users/{id} to delete a user"
                );
            }
            if (targetIsSelf) {
                throw new ApiException(HttpStatus.CONFLICT, "You cannot change your own status");
            }
            if (targetIsAdmin && !callerIsElevated) {
                throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Administrator accounts cannot be modified"
                );
            }
            changes.put("status", change(target.getStatus().name(), request.status().name()));
            if (request.status() == UserStatus.BLOCKED) {
                target.setBlockedAt(LocalDateTime.now(clock));
                sessionsRevoked = true;
            } else {
                target.setBlockedAt(null);
                target.setBlockedReason(null);
            }
            target.setStatus(request.status());
        }

        UserRole roleBefore = targetIsAdmin ? UserRole.ADMIN : UserRole.STUDENT;
        if (request.role() != null && request.role() != roleBefore) {
            if (targetIsSelf) {
                throw new ApiException(HttpStatus.CONFLICT, "You cannot change your own role");
            }
            // Demoting an administrator has always been open to any administrator, and
            // stays that way. The elevated operator is the exception: demoting it out of
            // admins is a lockout the API has no way back from, which is the same reason
            // the self-guard above exists.
            if (targetIsElevated && !callerIsElevated) {
                throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Administrator accounts cannot be modified"
                );
            }
            changes.put("role", change(roleBefore.name(), request.role().name()));
            if (request.role() == UserRole.ADMIN) {
                Admin admin = new Admin();
                admin.setStudent(target);
                adminRepository.save(admin);
                // Promoting revokes the sessions for the same reason demoting does, plus
                // one of its own: admin membership is resolved per request, so a live
                // student token would silently become an admin session that no ADMIN_LOGIN
                // ever recorded, and its eventual logout would write an ADMIN_LOGOUT with
                // no matching login. A fresh sign-in produces a real pair.
                sessionsRevoked = true;
            } else {
                Admin admin = adminRepository.findByStudent(target).orElseThrow(
                        () -> new ApiException(HttpStatus.CONFLICT, "User is not an administrator")
                );
                // Warnings and reviewed reports point at the admin row, so the database
                // refuses to delete one that has been used. Checked up front: letting the
                // constraint fire answers with an unexplained "State conflict" instead.
                if (adminRepository.hasModerationHistory(admin)) {
                    throw new ApiException(
                            HttpStatus.CONFLICT,
                            "Administrator has moderation history and cannot be demoted"
                    );
                }
                // Demoting revokes the sessions too: an admin token outlives a student
                // one, and the panel would keep working until it expired.
                adminRepository.delete(admin);
                sessionsRevoked = true;
            }
        }

        if (changes.isEmpty()) {
            return new BasicResponse("Updated user successfully", true);
        }

        studentRepository.save(target);
        if (sessionsRevoked) {
            revokeTokens(target);
        }

        Map<String, Object> metadata = elevationMetadata(principal, targetIsAdmin);
        if (sessionsRevoked) {
            metadata.put("sessionsRevoked", true);
        }
        auditWriter.write(
                principal.admin(),
                AuditAction.USER_UPDATED,
                AuditTargetType.USER,
                target.getId(),
                label,
                changes,
                metadata
        );
        return new BasicResponse("Updated user successfully", true);
    }

    @Transactional
    public BasicResponse deleteStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        boolean targetIsAdmin = adminRepository.existsByStudent(target);
        protectAdministrator(principal, target);

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
                elevationMetadata(principal, targetIsAdmin)
        );
        return new BasicResponse("Deleted user successfully", true);
    }

    @Transactional
    public BasicResponse blockStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        boolean targetIsAdmin = adminRepository.existsByStudent(target);
        protectAdministrator(principal, target);
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
                elevationMetadata(principal, targetIsAdmin)
        );
        return new BasicResponse("Student blocked successfully", true);
    }

    @Transactional
    public BasicResponse unblockStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        boolean targetIsAdmin = adminRepository.existsByStudent(target);
        protectAdministrator(principal, target);
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
                elevationMetadata(principal, targetIsAdmin)
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
        boolean targetIsAdmin = adminRepository.existsByStudent(target);
        protectAdministrator(principal, target);
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
                warningMetadata(principal, targetIsAdmin, message)
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

    /**
     * Corrects the text of a warning that was already issued. The student is not
     * re-notified: the notification was delivered when the warning was created, and
     * rewording it is a correction of the record, not a new warning.
     */
    @Transactional
    public BasicResponse updateWarning(
            AuthenticatedUser principal,
            UUID studentId,
            UUID warningId,
            WarningRequest request
    ) {
        String message = request == null || request.message() == null
                ? ""
                : request.message().trim();
        if (message.isEmpty() || message.length() > 2_000) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Warning message is required");
        }

        Warning warning = findWarning(studentId, warningId);
        if (message.equals(warning.getMessage())) {
            return new BasicResponse("Updated warning successfully", true);
        }

        String before = warning.getMessage();
        warning.setMessage(message);
        warningRepository.save(warning);
        auditWriter.write(
                principal.admin(),
                AuditAction.USER_WARNING_UPDATED,
                AuditTargetType.WARNING,
                warning.getId(),
                "Warning for " + userLabel(warning.getStudent()),
                change("message", before, message),
                Map.of()
        );
        return new BasicResponse("Updated warning successfully", true);
    }

    /** Withdraws a warning that should not have been issued. */
    @Transactional
    public BasicResponse deleteWarning(
            AuthenticatedUser principal,
            UUID studentId,
            UUID warningId
    ) {
        Warning warning = findWarning(studentId, warningId);
        Student target = warning.getStudent();
        long before = warningRepository.countByStudent(target);
        String message = warning.getMessage();

        warningRepository.delete(warning);
        auditWriter.write(
                principal.admin(),
                AuditAction.USER_WARNING_DELETED,
                AuditTargetType.WARNING,
                warningId,
                "Warning for " + userLabel(target),
                change("warnings", before, before - 1),
                Map.of("reason", message)
        );
        return new BasicResponse("Deleted warning successfully", true);
    }

    private Warning findWarning(UUID studentId, UUID warningId) {
        Warning warning = warningRepository.findById(warningId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Warning not found"));
        // The warning is addressed as a sub-resource of the student, so a mismatched
        // pair is a wrong URL rather than a warning that happens to belong elsewhere.
        if (!warning.getStudent().getId().equals(studentId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Warning not found");
        }
        return warning;
    }

    private String normalizeKitEmail(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (!KIT_EMAIL.matcher(email).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid KIT email");
        }
        return email;
    }

    private static Map<String, Object> change(String field, Object before, Object after) {
        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put(field, change(before, after));
        return changes;
    }

    private static Map<String, Object> change(Object before, Object after) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("before", before);
        value.put("after", after);
        return value;
    }

    private Student findMutableStudent(UUID id) {
        Student target = studentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (target.getStatus() == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }
        return target;
    }

    /**
     * The guard behind delete, block, unblock and warn. Two rules that used to be one,
     * and had to be separated: an administrator account is off limits unless the caller
     * is an elevated operator, but nobody moderates their own account at all. Self used
     * to be refused only incidentally, because the caller is necessarily an administrator
     * and so the first rule caught it — lifting that rule for an elevated caller would
     * have taken the only self-protection these four endpoints have with it.
     *
     * <p>Both refusals answer 409, the status these endpoints have always refused with.
     */
    private void protectAdministrator(AuthenticatedUser principal, Student target) {
        if (target.getId().equals(principal.student().getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You cannot moderate your own account");
        }
        if (adminRepository.existsByStudent(target) && !isElevated(principal)) {
            throw new ApiException(HttpStatus.CONFLICT, "Administrator accounts cannot be modified");
        }
    }

    /** The warning reason, plus the elevation marker when one applies. */
    private Map<String, Object> warningMetadata(
            AuthenticatedUser principal,
            boolean targetIsAdmin,
            String message
    ) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("reason", message);
        metadata.putAll(elevationMetadata(principal, targetIsAdmin));
        return metadata;
    }

    /**
     * Marks an entry as an action only an elevated operator could have taken. Recorded in
     * the metadata on purpose: the audit actor keeps reporting the ADMIN role, because
     * elevation is not one and the panel renders that role.
     */
    private Map<String, Object> elevationMetadata(AuthenticatedUser principal, boolean targetIsAdmin) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        if (targetIsAdmin && isElevated(principal)) {
            metadata.put("elevated", true);
        }
        return metadata;
    }

    /**
     * An elevated operator: an administrator whose address is configured as a superuser.
     * Elevation is not a role — it lifts the refusals that protect administrator accounts
     * and nothing else, and every response still reports these accounts as ADMIN.
     */
    private boolean isElevated(AuthenticatedUser principal) {
        return principal.isAdmin()
                && superuserPolicy.isSuperuser(principal.student().getKitEmail());
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
                reports,
                student.getCredibilityScore()
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
                        issuer.getStudent().getUsername(),
                        UtcDates.format(warning.getCreatedAt())
                );
        return new WarningResponse(
                warning.getId(),
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
