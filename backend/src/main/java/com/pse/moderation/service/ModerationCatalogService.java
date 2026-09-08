package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.dto.request.LectureUpdateRequest;
import com.pse.moderation.dto.request.ProfessorUpdateRequest;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.error.ApiException;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.service.AnswerCleanup;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The catalogue behind the ratings: lectures and professors. Both could be created but
 * never corrected, so a lecture entered with the wrong code or semester was permanent.
 */
@Service
public class ModerationCatalogService {

    private final LectureRepository lectureRepository;
    private final ProfessorRepository professorRepository;
    private final AnswerRepository answerRepository;
    private final AnswerCleanup answerCleanup;
    private final AuditWriter auditWriter;

    public ModerationCatalogService(
            LectureRepository lectureRepository,
            ProfessorRepository professorRepository,
            AnswerRepository answerRepository,
            AnswerCleanup answerCleanup,
            AuditWriter auditWriter
    ) {
        this.lectureRepository = lectureRepository;
        this.professorRepository = professorRepository;
        this.answerRepository = answerRepository;
        this.answerCleanup = answerCleanup;
        this.auditWriter = auditWriter;
    }

    @Transactional
    public BasicResponse updateLecture(
            AuthenticatedUser principal,
            UUID lectureId,
            LectureUpdateRequest request
    ) {
        if (request == null
                || (request.name() == null
                && request.code() == null
                && request.semesterYear() == null
                && request.semesterSeason() == null
                && request.active() == null
                && request.lectureType() == null
                && request.professorIds() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No update supplied");
        }

        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lecture not found"));
        Map<String, Object> changes = new LinkedHashMap<>();

        if (request.name() != null) {
            String name = request.name().trim();
            if (name.isEmpty() || name.length() > 300) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid lecture name");
            }
            if (!name.equals(lecture.getName())) {
                changes.put("name", change(lecture.getName(), name));
                lecture.setName(name);
            }
        }
        if (request.code() != null) {
            String code = request.code().trim();
            if (code.length() > 100) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid lecture code");
            }
            String before = lecture.getCode() == null ? "" : lecture.getCode();
            if (!code.equals(before)) {
                changes.put("code", change(before, code));
                lecture.setCode(code);
            }
        }
        if (request.semesterYear() != null && request.semesterYear() != lecture.getSemesterYear()) {
            int year = request.semesterYear();
            if (year < 1900 || year > 2200) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid semester year");
            }
            changes.put("semesterYear", change(lecture.getSemesterYear(), year));
            lecture.setSemesterYear(year);
        }
        if (request.semesterSeason() != null
                && request.semesterSeason() != lecture.getSemesterSeason()) {
            changes.put("semesterSeason",
                    change(lecture.getSemesterSeason().name(), request.semesterSeason().name()));
            lecture.setSemesterSeason(request.semesterSeason());
        }
        if (request.active() != null && request.active() != lecture.isActive()) {
            changes.put("active", change(lecture.isActive(), request.active()));
            lecture.setActive(request.active());
        }
        if (request.lectureType() != null && request.lectureType() != lecture.getLectureType()) {
            changes.put("lectureType",
                    change(lecture.getLectureType().name(), request.lectureType().name()));
            lecture.setLectureType(request.lectureType());
        }
        if (request.professorIds() != null) {
            List<Professor> professors = resolveProfessors(request.professorIds());
            List<UUID> before = lecture.getProfessors().stream().map(Professor::getId).toList();
            List<UUID> after = professors.stream().map(Professor::getId).toList();
            // Compared as a multiset -- BUG-3. lecture.getProfessors() is a Set and the
            // resolved list carries the order of the request, so comparing by position made
            // an unchanged assignment look edited and wrote a bogus audit event for it.
            if (!sameAssignment(before, after)) {
                changes.put("professors", change(labels(before), labels(after)));
                lecture.getProfessors().clear();
                lecture.getProfessors().addAll(professors);
            }
        }

        if (changes.isEmpty()) {
            return new BasicResponse("Updated lecture successfully", true);
        }

        lectureRepository.save(lecture);
        auditWriter.write(
                principal.admin(),
                AuditAction.LECTURE_UPDATED,
                AuditTargetType.LECTURE,
                lecture.getId(),
                lectureLabel(lecture),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated lecture successfully", true);
    }

    /**
     * Removes a lecture together with every comment, answer and rating filed under it.
     *
     * <p>This throws away student contributions, which is rarely what is wanted — setting
     * {@code active = false} takes a lecture out of the app while keeping its history.
     * Deleting is for a lecture that should never have existed.
     */
    @Transactional
    public BasicResponse deleteLecture(AuthenticatedUser principal, UUID lectureId) {
        Lecture lecture = lectureRepository.findById(lectureId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lecture not found"));
        String label = lectureLabel(lecture);
        int comments = lecture.getComments().size();
        int ratings = lecture.getRatings().size();

        // Comments and ratings are cascaded from the lecture, and answers from their
        // comment; answer votes and notifications are not cascaded from anything here.
        answerCleanup.clear(answerRepository.findIdsByLectureId(lectureId));

        // The professor assignment is a join table owned by the lecture, so its rows go
        // with it. Clearing it explicitly keeps the in-memory state consistent first.
        lecture.getProfessors().clear();
        lectureRepository.delete(lecture);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", true, "after", false));
        auditWriter.write(
                principal.admin(),
                AuditAction.LECTURE_DELETED,
                AuditTargetType.LECTURE,
                lectureId,
                label,
                changes,
                Map.of("deletedComments", comments, "deletedRatings", ratings)
        );
        return new BasicResponse("Deleted lecture successfully", true);
    }

    @Transactional
    public BasicResponse updateProfessor(
            AuthenticatedUser principal,
            UUID professorId,
            ProfessorUpdateRequest request
    ) {
        if (request == null
                || (request.firstName() == null
                && request.lastName() == null
                && request.active() == null
                && request.lectureIds() == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No update supplied");
        }

        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Professor not found"));
        Map<String, Object> changes = new LinkedHashMap<>();

        if (request.firstName() != null) {
            String firstName = requireName(request.firstName(), "Invalid first name");
            if (!firstName.equals(professor.getFirstName())) {
                changes.put("firstName", change(professor.getFirstName(), firstName));
                professor.setFirstName(firstName);
            }
        }
        if (request.lastName() != null) {
            String lastName = requireName(request.lastName(), "Invalid last name");
            if (!lastName.equals(professor.getLastName())) {
                changes.put("lastName", change(professor.getLastName(), lastName));
                professor.setLastName(lastName);
            }
        }
        if (request.active() != null && request.active() != professor.isActive()) {
            changes.put("active", change(professor.isActive(), request.active()));
            professor.setActive(request.active());
        }
        if (request.lectureIds() != null) {
            changes.putAll(reassignLectures(professor, request.lectureIds()));
        }

        if (changes.isEmpty()) {
            return new BasicResponse("Updated professor successfully", true);
        }

        professorRepository.save(professor);
        auditWriter.write(
                principal.admin(),
                AuditAction.PROFESSOR_UPDATED,
                AuditTargetType.PROFESSOR,
                professor.getId(),
                professorLabel(professor),
                changes,
                Map.of()
        );
        return new BasicResponse("Updated professor successfully", true);
    }

    /**
     * Removes a professor. Lectures survive — they are only detached, since a lecture
     * without a listed professor is still a lecture people rated.
     */
    @Transactional
    public BasicResponse deleteProfessor(AuthenticatedUser principal, UUID professorId) {
        Professor professor = professorRepository.findById(professorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Professor not found"));
        String label = professorLabel(professor);

        // The join table is owned by Lecture, so the rows have to be removed from that
        // side; deleting the inverse side alone leaves them pointing at nothing.
        int detached = professor.getLectures().size();
        reassignLectures(professor, List.of());
        professorRepository.delete(professor);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", true, "after", false));
        auditWriter.write(
                principal.admin(),
                AuditAction.PROFESSOR_DELETED,
                AuditTargetType.PROFESSOR,
                professorId,
                label,
                changes,
                Map.of("detachedLectures", detached)
        );
        return new BasicResponse("Deleted professor successfully", true);
    }

    /** Rewrites the professor's lecture assignment from the owning (lecture) side. */
    private Map<String, Object> reassignLectures(Professor professor, List<UUID> lectureIds) {
        List<Lecture> after = resolveLectures(lectureIds);
        List<UUID> beforeIds = professor.getLectures().stream().map(Lecture::getId).toList();
        List<UUID> afterIds = after.stream().map(Lecture::getId).toList();
        // The mirror image of the professor assignment above, and unordered for the same
        // reason: professor.getLectures() is a Set.
        if (sameAssignment(beforeIds, afterIds)) {
            return Map.of();
        }

        for (Lecture lecture : new ArrayList<>(professor.getLectures())) {
            if (!afterIds.contains(lecture.getId())) {
                lecture.getProfessors().removeIf(held -> held.getId().equals(professor.getId()));
                lectureRepository.save(lecture);
            }
        }
        for (Lecture lecture : after) {
            if (lecture.getProfessors().stream()
                    .noneMatch(held -> held.getId().equals(professor.getId()))) {
                lecture.getProfessors().add(professor);
                lectureRepository.save(lecture);
            }
        }
        professor.getLectures().clear();
        professor.getLectures().addAll(after);

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("lectures", change(labels(beforeIds), labels(afterIds)));
        return changes;
    }

    private List<Professor> resolveProfessors(List<UUID> ids) {
        List<Professor> professors = professorRepository.findAllById(ids);
        if (professors.size() != ids.stream().distinct().count()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Professor not found");
        }
        return professors;
    }

    private List<Lecture> resolveLectures(List<UUID> ids) {
        List<Lecture> lectures = lectureRepository.findAllById(ids);
        if (lectures.size() != ids.stream().distinct().count()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Lecture not found");
        }
        return lectures;
    }

    private String requireName(String raw, String message) {
        String name = raw.trim();
        if (name.isEmpty() || name.length() > 200) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return name;
    }

    private static List<String> labels(List<UUID> ids) {
        return ids.stream().map(UUID::toString).toList();
    }

    private static String lectureLabel(Lecture lecture) {
        String code = lecture.getCode();
        String name = lecture.getName();
        return code == null || code.isBlank() ? name : code + " — " + name;
    }

    private static String professorLabel(Professor professor) {
        return professor.getFirstName() + " " + professor.getLastName();
    }

    /**
     * Whether two id assignments hold the same members, regardless of the order they come
     * out in. Both sides are read from a {@code Set} on one end and from a request or a
     * repository lookup on the other, so position carries no information -- BUG-3.
     */
    private static boolean sameAssignment(List<UUID> before, List<UUID> after) {
        return sorted(before).equals(sorted(after));
    }

    private static List<String> sorted(List<UUID> ids) {
        return ids.stream().map(UUID::toString).sorted().toList();
    }

    private static Map<String, Object> change(Object before, Object after) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("before", before);
        value.put("after", after);
        return value;
    }
}
