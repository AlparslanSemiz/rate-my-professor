package com.pse.moderation.service;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.dto.request.LectureUpdateRequest;
import com.pse.moderation.dto.request.ProfessorUpdateRequest;
import com.pse.moderation.model.Admin;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.rating.model.LectureType;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.enums.SemesterSeason;
import com.pse.shared.error.ApiException;
import com.pse.social.repository.AnswerRepository;
import com.pse.social.service.AnswerCleanup;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * The catalogue edits, which is where the branch coverage was: {@code updateLecture} and
 * {@code updateProfessor} together carried 48 of the module's missed branches, more than any
 * other untested method.
 *
 * <p>Both methods are shaped the same way — validate, then walk the request field by field,
 * recording a change only when the value actually differs, and write nothing at all if
 * nothing did. That last property is the one worth testing hardest: a method that saves and
 * writes an audit entry for an edit that changed nothing fills the moderation trail with
 * events nobody performed.
 */
@ExtendWith(MockitoExtension.class)
class ModerationCatalogServiceTests {

    @Mock private LectureRepository lectureRepository;
    @Mock private ProfessorRepository professorRepository;
    @Mock private AnswerRepository answerRepository;
    @Mock private AnswerCleanup answerCleanup;
    @Mock private AuditWriter auditWriter;

    private ModerationCatalogService service() {
        return new ModerationCatalogService(
                lectureRepository, professorRepository, answerRepository, answerCleanup, auditWriter);
    }

    private static final UUID LECTURE_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PROFESSOR_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    // ---------------------------------------------------------------- updateLecture

    @Test
    void updateLecture_nullRequest_isRejectedBeforeTheLectureIsEvenLookedUp() {
        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID, null))
                .isInstanceOf(ApiException.class)
                .hasMessage("No update supplied")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verifyNoInteractions(lectureRepository, auditWriter);
    }

    @Test
    void updateLecture_everyFieldNull_isRejectedAsNoUpdate() {
        LectureUpdateRequest empty = new LectureUpdateRequest(null, null, null, null, null, null, null);

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID, empty))
                .isInstanceOf(ApiException.class)
                .hasMessage("No update supplied");

        verifyNoInteractions(lectureRepository, auditWriter);
    }

    @Test
    void updateLecture_unknownLecture_isNotFound() {
        when(lectureRepository.findById(LECTURE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID, nameChange("Analysis 1")))
                .isInstanceOf(ApiException.class)
                .hasMessage("Lecture not found")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);

        verifyNoInteractions(auditWriter);
    }

    @Test
    void updateLecture_blankName_isRejected() {
        givenLecture(lecture());

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID, nameChange("   ")))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid lecture name");

        verify(lectureRepository, never()).save(any());
    }

    @Test
    void updateLecture_nameLongerThanTheColumn_isRejected() {
        givenLecture(lecture());

        assertThatThrownBy(() ->
                service().updateLecture(principal(), LECTURE_ID, nameChange("x".repeat(301))))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid lecture name");
    }

    @Test
    void updateLecture_nameAtTheLengthLimit_isAccepted() {
        Lecture lecture = lecture();
        givenLecture(lecture);
        String name = "x".repeat(300);

        service().updateLecture(principal(), LECTURE_ID, nameChange(name));

        assertThat(lecture.getName()).isEqualTo(name);
    }

    @Test
    void updateLecture_nameIsTrimmedBeforeItIsCompared() {
        Lecture lecture = lecture();
        lecture.setName("Analysis 1");
        givenLecture(lecture);

        BasicResponse response = service().updateLecture(principal(), LECTURE_ID, nameChange("  Analysis 1  "));

        // Trimmed to the value it already has: no change, so nothing is written.
        assertThat(response.success()).isTrue();
        verify(lectureRepository, never()).save(any());
        verifyNoInteractions(auditWriter);
    }

    @Test
    void updateLecture_codeLongerThanTheColumn_isRejected() {
        givenLecture(lecture());
        LectureUpdateRequest request =
                new LectureUpdateRequest(null, "x".repeat(101), null, null, null, null, null);

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID, request))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid lecture code");
    }

    @Test
    void updateLecture_codeOnALectureThatHadNone_recordsTheBeforeValueAsEmptyRatherThanNull() {
        Lecture lecture = lecture();
        lecture.setCode(null);
        givenLecture(lecture);
        LectureUpdateRequest request =
                new LectureUpdateRequest(null, "LA1", null, null, null, null, null);

        service().updateLecture(principal(), LECTURE_ID, request);

        assertThat(changesWritten()).containsKey("code");
        assertThat(before(changesWritten(), "code")).isEqualTo("");
        assertThat(after(changesWritten(), "code")).isEqualTo("LA1");
    }

    @Test
    void updateLecture_semesterYearOutOfRange_isRejectedAtBothEnds() {
        givenLecture(lecture());

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, 1899, null, null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid semester year");

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, 2201, null, null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid semester year");
    }

    @Test
    void updateLecture_semesterYearAtBothBounds_isAccepted() {
        Lecture lecture = lecture();
        givenLecture(lecture);

        service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, 1900, null, null, null, null));
        assertThat(lecture.getSemesterYear()).isEqualTo(1900);

        service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, 2200, null, null, null, null));
        assertThat(lecture.getSemesterYear()).isEqualTo(2200);
    }

    @Test
    void updateLecture_semesterYearUnchanged_isNotValidatedAndNotRecorded() {
        Lecture lecture = lecture();
        lecture.setSemesterYear(2026);
        givenLecture(lecture);

        BasicResponse response = service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, 2026, null, null, null, null));

        assertThat(response.success()).isTrue();
        verifyNoInteractions(auditWriter);
    }

    @Test
    void updateLecture_seasonTypeAndActiveFlag_areEachRecordedByName() {
        Lecture lecture = lecture();
        lecture.setSemesterSeason(SemesterSeason.SS);
        lecture.setLectureType(LectureType.LECTURE_ONLY);
        lecture.setActive(true);
        givenLecture(lecture);

        service().updateLecture(principal(), LECTURE_ID, new LectureUpdateRequest(
                null, null, null, SemesterSeason.WS, false, LectureType.LECTURE_AND_EXERCISE, null));

        Map<String, Object> changes = changesWritten();
        assertThat(changes).containsOnlyKeys("semesterSeason", "active", "lectureType");
        assertThat(after(changes, "semesterSeason")).isEqualTo("WS");
        assertThat(after(changes, "active")).isEqualTo(false);
        assertThat(after(changes, "lectureType")).isEqualTo("LECTURE_AND_EXERCISE");
        assertThat(lecture.getSemesterSeason()).isEqualTo(SemesterSeason.WS);
        assertThat(lecture.isActive()).isFalse();
        assertThat(lecture.getLectureType()).isEqualTo(LectureType.LECTURE_AND_EXERCISE);
    }

    @Test
    void updateLecture_seasonTypeAndActiveFlagResubmittedUnchanged_recordNothing() {
        Lecture lecture = lecture();
        lecture.setSemesterSeason(SemesterSeason.SS);
        lecture.setLectureType(LectureType.LECTURE_ONLY);
        lecture.setActive(true);
        givenLecture(lecture);

        BasicResponse response = service().updateLecture(principal(), LECTURE_ID, new LectureUpdateRequest(
                null, null, null, SemesterSeason.SS, true, LectureType.LECTURE_ONLY, null));

        assertThat(response.success()).isTrue();
        verify(lectureRepository, never()).save(any());
        verifyNoInteractions(auditWriter);
    }

    @Test
    void updateLecture_professorIdThatDoesNotResolve_isNotFound() {
        givenLecture(lecture());
        UUID missing = UUID.randomUUID();
        when(professorRepository.findAllById(List.of(missing))).thenReturn(List.of());

        assertThatThrownBy(() -> service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, null, null, null, null, List.of(missing))))
                .isInstanceOf(ApiException.class)
                .hasMessage("Professor not found")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void updateLecture_emptyProfessorList_clearsTheAssignmentAndRecordsIt() {
        Professor held = professor(PROFESSOR_ID, "Peter", "Sanders");
        Lecture lecture = lecture();
        lecture.setProfessors(new LinkedHashSet<>(List.of(held)));
        givenLecture(lecture);
        when(professorRepository.findAllById(List.of())).thenReturn(List.of());

        service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, null, null, null, null, List.of()));

        assertThat(lecture.getProfessors()).isEmpty();
        assertThat(after(changesWritten(), "professors")).isEqualTo(List.of());
    }

    /**
     * BUG-3, the write side, fixed.
     *
     * <p>{@code Lecture.professors} is a {@code Set}, which defines no order, but
     * {@code updateLecture} built {@code before} from the set's iteration order and
     * {@code after} from the order {@code findAllById} happened to return, then compared
     * them position by position. So an assignment that did not change was recorded as a
     * change and wrote an audit event nobody performed. The two are compared as multisets
     * now, so the same members in another order are the same assignment.
     *
     * <p>Real {@code HashSet} order is not used here: {@code Professor} overrides neither
     * {@code equals} nor {@code hashCode}, so ordering depends on object addresses and varies
     * per run. A test built on that would be flaky, and the flakiness would sit in the test
     * instead of in the defect. A {@code LinkedHashSet} plus a stubbed repository order states
     * the same fact and states it every time.
     */
    @Test
    void updateLecture_sameProfessorsInAnotherOrder_recordsNoChange() {
        Professor first = professor(PROFESSOR_ID, "Peter", "Sanders");
        Professor second = professor(UUID.fromString("33333333-3333-3333-3333-333333333333"),
                "Dorothea", "Wagner");

        Lecture lecture = lecture();
        lecture.setProfessors(new LinkedHashSet<>(List.of(first, second)));
        givenLecture(lecture);

        List<UUID> requested = List.of(first.getId(), second.getId());
        // The repository is free to return them in any order; this one is reversed.
        when(professorRepository.findAllById(requested)).thenReturn(List.of(second, first));

        BasicResponse response = service().updateLecture(principal(), LECTURE_ID,
                new LectureUpdateRequest(null, null, null, null, null, null, requested));

        assertThat(response.success()).isTrue();

        // Nothing changed, so nothing is recorded -- and with no other field in the request
        // there is no audit event at all, which is the second half of what the bogus change
        // used to produce.
        verifyNoInteractions(auditWriter);
        assertThat(lecture.getProfessors()).containsExactlyInAnyOrder(first, second);
    }

    @Test
    void updateLecture_changedFields_areSavedAndAuditedAsOneLectureUpdatedEntry() {
        Lecture lecture = lecture();
        lecture.setName("Analysis 1");
        lecture.setCode("ANA1");
        givenLecture(lecture);

        BasicResponse response = service().updateLecture(principal(), LECTURE_ID, nameChange("Analysis I"));

        assertThat(response.success()).isTrue();
        assertThat(response.message()).isEqualTo("Updated lecture successfully");
        verify(lectureRepository).save(lecture);

        ArgumentCaptor<AuditAction> action = ArgumentCaptor.forClass(AuditAction.class);
        ArgumentCaptor<AuditTargetType> targetType = ArgumentCaptor.forClass(AuditTargetType.class);
        ArgumentCaptor<String> label = ArgumentCaptor.forClass(String.class);
        verify(auditWriter).write(any(), action.capture(), targetType.capture(),
                any(), label.capture(), any(), any());

        assertThat(action.getValue()).isEqualTo(AuditAction.LECTURE_UPDATED);
        assertThat(targetType.getValue()).isEqualTo(AuditTargetType.LECTURE);
        // The label is built from the lecture after the edit, code first.
        assertThat(label.getValue()).isEqualTo("ANA1 — Analysis I");
    }

    // -------------------------------------------------------------- updateProfessor

    @Test
    void updateProfessor_nullRequest_isRejectedBeforeTheProfessorIsLookedUp() {
        assertThatThrownBy(() -> service().updateProfessor(principal(), PROFESSOR_ID, null))
                .isInstanceOf(ApiException.class)
                .hasMessage("No update supplied");

        verifyNoInteractions(professorRepository, auditWriter);
    }

    @Test
    void updateProfessor_everyFieldNull_isRejectedAsNoUpdate() {
        assertThatThrownBy(() -> service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest(null, null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("No update supplied");

        verifyNoInteractions(professorRepository, auditWriter);
    }

    @Test
    void updateProfessor_unknownProfessor_isNotFound() {
        when(professorRepository.findById(PROFESSOR_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest("Peter", null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Professor not found");
    }

    @Test
    void updateProfessor_blankOrOverlongNames_areRejectedPerField() {
        givenProfessor(professor(PROFESSOR_ID, "Peter", "Sanders"));

        assertThatThrownBy(() -> service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest("  ", null, null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid first name");

        assertThatThrownBy(() -> service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest(null, "x".repeat(201), null, null)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid last name");
    }

    @Test
    void updateProfessor_namesResubmittedUnchanged_recordNothing() {
        givenProfessor(professor(PROFESSOR_ID, "Peter", "Sanders"));

        BasicResponse response = service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest("Peter", "Sanders", null, null));

        assertThat(response.success()).isTrue();
        verify(professorRepository, never()).save(any());
        verifyNoInteractions(auditWriter);
    }

    @Test
    void updateProfessor_changedNamesAndActiveFlag_areRecordedAndSaved() {
        Professor professor = professor(PROFESSOR_ID, "Peter", "Sanders");
        professor.setActive(true);
        givenProfessor(professor);

        service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest("Dorothea", "Wagner", false, null));

        Map<String, Object> changes = changesWritten();
        assertThat(changes).containsOnlyKeys("firstName", "lastName", "active");
        assertThat(after(changes, "firstName")).isEqualTo("Dorothea");
        assertThat(after(changes, "lastName")).isEqualTo("Wagner");
        assertThat(after(changes, "active")).isEqualTo(false);
        verify(professorRepository).save(professor);
    }

    @Test
    void updateProfessor_lectureIdThatDoesNotResolve_isNotFound() {
        givenProfessor(professor(PROFESSOR_ID, "Peter", "Sanders"));
        UUID missing = UUID.randomUUID();
        when(lectureRepository.findAllById(List.of(missing))).thenReturn(List.of());

        assertThatThrownBy(() -> service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest(null, null, null, List.of(missing))))
                .isInstanceOf(ApiException.class)
                .hasMessage("Lecture not found");
    }

    @Test
    void updateProfessor_sameLectureAssignment_recordsNothingAndTouchesNoLecture() {
        Professor professor = professor(PROFESSOR_ID, "Peter", "Sanders");
        Lecture held = lecture();
        professor.setLectures(new LinkedHashSet<>(List.of(held)));
        givenProfessor(professor);
        when(lectureRepository.findAllById(List.of(LECTURE_ID))).thenReturn(List.of(held));

        BasicResponse response = service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest(null, null, null, List.of(LECTURE_ID)));

        assertThat(response.success()).isTrue();
        verify(lectureRepository, never()).save(any());
        verify(professorRepository, never()).save(any());
        verifyNoInteractions(auditWriter);
    }

    /**
     * The join table is owned by {@code Lecture}, so a reassignment has to be written from the
     * lecture side: the lecture being dropped is saved without the professor, the lecture being
     * added is saved with it. Verified on both lectures rather than only on the outcome,
     * because a reassignment that updates the professor's own collection and forgets the owning
     * side leaves the database unchanged while every in-memory assertion passes.
     */
    @Test
    void updateProfessor_reassignedLectures_areWrittenFromTheOwningSide() {
        Professor professor = professor(PROFESSOR_ID, "Peter", "Sanders");
        Lecture dropped = lecture();
        dropped.setProfessors(new LinkedHashSet<>(List.of(professor)));
        Lecture added = lecture();
        added.setId(UUID.fromString("44444444-4444-4444-4444-444444444444"));
        added.setName("Algorithmen 2");

        professor.setLectures(new LinkedHashSet<>(List.of(dropped)));
        givenProfessor(professor);
        when(lectureRepository.findAllById(List.of(added.getId()))).thenReturn(List.of(added));

        service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest(null, null, null, List.of(added.getId())));

        assertThat(dropped.getProfessors()).doesNotContain(professor);
        assertThat(added.getProfessors()).contains(professor);
        assertThat(professor.getLectures()).containsExactly(added);
        verify(lectureRepository).save(dropped);
        verify(lectureRepository).save(added);

        assertThat(changesWritten()).containsKey("lectures");
        assertThat(before(changesWritten(), "lectures")).isEqualTo(List.of(LECTURE_ID.toString()));
        assertThat(after(changesWritten(), "lectures")).isEqualTo(List.of(added.getId().toString()));
    }

    @Test
    void updateProfessor_lectureAlreadyCarryingTheProfessor_isNotSavedTwice() {
        Professor professor = professor(PROFESSOR_ID, "Peter", "Sanders");
        Lecture kept = lecture();
        kept.setProfessors(new LinkedHashSet<>(List.of(professor)));
        Lecture added = lecture();
        added.setId(UUID.fromString("44444444-4444-4444-4444-444444444444"));
        // Already holds the professor, so the attach loop must skip it.
        added.setProfessors(new LinkedHashSet<>(List.of(professor)));

        professor.setLectures(new LinkedHashSet<>(List.of(kept)));
        givenProfessor(professor);
        when(lectureRepository.findAllById(anyList())).thenReturn(List.of(kept, added));

        service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest(null, null, null, List.of(kept.getId(), added.getId())));

        verify(lectureRepository, never()).save(added);
        assertThat(professor.getLectures()).containsExactly(kept, added);
    }

    @Test
    void updateProfessor_changedFields_areAuditedAsOneProfessorUpdatedEntry() {
        givenProfessor(professor(PROFESSOR_ID, "Peter", "Sanders"));

        service().updateProfessor(principal(), PROFESSOR_ID,
                new ProfessorUpdateRequest("Dorothea", null, null, null));

        ArgumentCaptor<AuditAction> action = ArgumentCaptor.forClass(AuditAction.class);
        ArgumentCaptor<AuditTargetType> targetType = ArgumentCaptor.forClass(AuditTargetType.class);
        ArgumentCaptor<String> label = ArgumentCaptor.forClass(String.class);
        verify(auditWriter).write(any(), action.capture(), targetType.capture(),
                any(), label.capture(), any(), any());

        assertThat(action.getValue()).isEqualTo(AuditAction.PROFESSOR_UPDATED);
        assertThat(targetType.getValue()).isEqualTo(AuditTargetType.PROFESSOR);
        assertThat(label.getValue()).isEqualTo("Dorothea Sanders");
    }

    // ------------------------------------------------------------------- fixtures

    private void givenLecture(Lecture lecture) {
        when(lectureRepository.findById(LECTURE_ID)).thenReturn(Optional.of(lecture));
    }

    private void givenProfessor(Professor professor) {
        when(professorRepository.findById(PROFESSOR_ID)).thenReturn(Optional.of(professor));
    }

    private static LectureUpdateRequest nameChange(String name) {
        return new LectureUpdateRequest(name, null, null, null, null, null, null);
    }

    private static Lecture lecture() {
        Lecture lecture = new Lecture();
        lecture.setId(LECTURE_ID);
        lecture.setName("Algorithmen 1");
        lecture.setCode("ALG1");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SS);
        lecture.setLectureType(LectureType.LECTURE_ONLY);
        lecture.setActive(true);
        lecture.setProfessors(new LinkedHashSet<>());
        return lecture;
    }

    private static Professor professor(UUID id, String firstName, String lastName) {
        Professor professor = new Professor();
        professor.setId(id);
        professor.setFirstName(firstName);
        professor.setLastName(lastName);
        professor.setLectures(new LinkedHashSet<>());
        return professor;
    }

    private static AuthenticatedUser principal() {
        return new AuthenticatedUser(null, null, new Admin());
    }

    /** The changes map handed to the audit writer, which is where the field diff lands. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> changesWritten() {
        ArgumentCaptor<Map<String, Object>> changes = ArgumentCaptor.forClass(Map.class);
        verify(auditWriter).write(any(), any(), any(), any(), any(), changes.capture(), any());
        return changes.getValue();
    }

    @SuppressWarnings("unchecked")
    private static Object before(Map<String, Object> changes, String field) {
        return ((Map<String, Object>) changes.get(field)).get("before");
    }

    @SuppressWarnings("unchecked")
    private static Object after(Map<String, Object> changes, String field) {
        return ((Map<String, Object>) changes.get(field)).get("after");
    }
}
