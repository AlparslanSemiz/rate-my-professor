package com.pse.moderation.service.user;

import com.pse.moderation.dto.response.UserListResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.mapper.UserResponseMapper;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.shared.enums.UserRole;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
import com.pse.shared.page.KeysetPage;
import com.pse.shared.repository.IdCount;
import com.pse.shared.util.KeysetCursorCodec;
import com.pse.shared.util.SqlLike;
import com.pse.social.repository.CommentReportRepository;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

/**
 * Reading accounts: the searchable, keyset-paginated listing the panel shows, and one account
 * on its own.
 */
@Service
public class UserDirectoryService {

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final WarningRepository warningRepository;
    private final CommentReportRepository commentReportRepository;
    private final KeysetCursorCodec cursorCodec;
    private final UserResponseMapper mapper;

    public UserDirectoryService(
            StudentRepository studentRepository,
            AdminRepository adminRepository,
            WarningRepository warningRepository,
            CommentReportRepository commentReportRepository,
            KeysetCursorCodec cursorCodec,
            UserResponseMapper mapper
    ) {
        this.studentRepository = studentRepository;
        this.adminRepository = adminRepository;
        this.warningRepository = warningRepository;
        this.commentReportRepository = commentReportRepository;
        this.cursorCodec = cursorCodec;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public UserListResponse getStudents(
            String rawLimit,
            String rawCursor,
            String q,
            String rawStatus,
            String rawRole,
            String rawSort
    ) {
        Integer limit = KeysetPage.optionalLimit(rawLimit);
        UserStatus status = UserListQuery.parseStatusFilter(rawStatus);
        UserRole role = UserListQuery.parseUserRole(rawRole);
        Sort.Direction direction = UserListQuery.parseSortDirection(rawSort);
        boolean hasCursor = rawCursor != null && !rawCursor.isBlank();
        KeysetPage.requireLimitWithCursor(hasCursor, limit);
        KeysetCursorCodec.Cursor cursor = hasCursor
                ? cursorCodec.decode(rawCursor, "Invalid user cursor")
                : null;
        String search = q == null ? "" : q.trim();
        if (search.length() > 200) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User search is too long");
        }

        // Three batch queries instead of three per student.
        Set<UUID> adminIds = Set.copyOf(adminRepository.findAllAdminStudentIds());
        Map<UUID, Integer> warningCounts = IdCount.asMap(warningRepository.countGroupedByStudent());
        Map<UUID, Integer> reportCounts =
                IdCount.asMap(commentReportRepository.countGroupedByCommentStudent());

        Specification<Student> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            // Soft-deleted accounts are anonymised and are never listed, whatever else was
            // asked for. Returning them would over-report the size of the platform.
            predicates.add(builder.notEqual(root.get("status"), UserStatus.DELETED));
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (role != null) {
                predicates.add(UserListQuery.rolePredicate(builder, root, adminIds, role));
            }
            if (!search.isEmpty()) {
                String pattern = "%" + SqlLike.escape(search.toLowerCase(Locale.ROOT)) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("username")), pattern, SqlLike.ESCAPE),
                        builder.like(builder.lower(root.get("kitEmail")), pattern, SqlLike.ESCAPE)
                ));
            }
            if (cursor != null) {
                predicates.add(KeysetPage.after(
                        builder, root, cursor.createdAtLocal(), cursor.id(), direction));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };

        if (limit == null) {
            List<UserResponse> users = studentRepository.findAll(specification).stream()
                    .map(student -> mapper.toResponse(
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

        List<Student> fetched = studentRepository.findAll(
                specification,
                PageRequest.of(0, limit + 1, KeysetPage.byCreatedAtThenId(direction))
        ).getContent();
        KeysetPage.Slice<Student> slice = KeysetPage.of(fetched, limit,
                last -> cursorCodec.encode(last.getCreatedAt(), last.getId()));
        List<Student> page = slice.items();
        String nextCursor = slice.nextCursor();

        List<UserResponse> users = page.stream()
                .map(student -> mapper.toResponse(
                        student,
                        adminIds.contains(student.getId()),
                        warningCounts.getOrDefault(student.getId(), 0),
                        reportCounts.getOrDefault(student.getId(), 0)
                ))
                .toList();
        return new UserListResponse("Success", true, users, nextCursor);
    }

    @Transactional(readOnly = true)
    public UserResponse getStudent(UUID studentId) {
        Student student = studentRepository
                .findByIdAndStatusNot(studentId, UserStatus.DELETED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return mapper.toResponse(student);
    }
}
