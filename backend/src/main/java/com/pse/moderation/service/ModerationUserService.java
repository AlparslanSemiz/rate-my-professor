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
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
import com.pse.shared.util.UtcDates;
import com.pse.social.repository.CommentReportRepository;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ModerationUserService {

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final WarningRepository warningRepository;
    private final CommentReportRepository commentReportRepository;
    private final TokenRepository tokenRepository;
    private final AuditWriter auditWriter;
    private final AuthService authService;
    private final Clock clock;

    public ModerationUserService(
            StudentRepository studentRepository,
            AdminRepository adminRepository,
            WarningRepository warningRepository,
            CommentReportRepository commentReportRepository,
            TokenRepository tokenRepository,
            AuditWriter auditWriter,
            AuthService authService,
            Clock clock
    ) {
        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.warningRepository = warningRepository;
        this.commentReportRepository = commentReportRepository;
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
        List<UserResponse> users = studentRepository
                .findAllByStatusNotOrderByCreatedAtDesc(UserStatus.DELETED)
                .stream()
                .map(this::toUserResponse)
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

    @Transactional
    public BasicResponse deleteStudent(AuthenticatedUser principal, UUID studentId) {
        Student target = findMutableStudent(studentId);
        protectAdministrator(target);

        target.setStatus(UserStatus.DELETED);
        studentRepository.save(target);
        revokeTokens(target);
        auditWriter.write(
                principal.admin(),
                AuditAction.USER_DELETED,
                AuditTargetType.USER,
                target.getId(),
                userLabel(target),
                AuditWriter.change("exists", true, false),
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
                adminRepository.existsByStudent(student) ? UserRole.ADMIN : UserRole.STUDENT,
                student.getStatus(),
                UtcDates.format(joined),
                UtcDates.format(lastOnline),
                student.getBiography() == null ? "" : student.getBiography(),
                Math.toIntExact(warningRepository.countByStudent(student)),
                Math.toIntExact(commentReportRepository.countByCommentStudent(student))
        );
    }

    private WarningResponse toWarningResponse(Warning warning) {
        Admin issuer = warning.getAdmin();
        WarningIssuerResponse createdFrom = issuer == null
                ? null
                : new WarningIssuerResponse(
                        issuer.getStudent().getId(),
                        null,
                        UtcDates.format(issuer.getCreatedAt())
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
