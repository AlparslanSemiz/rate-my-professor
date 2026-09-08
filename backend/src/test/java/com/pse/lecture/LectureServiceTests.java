package com.pse.lecture;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.model.Lecture;
import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.moderation.model.Admin;
import com.pse.lecture.repository.LectureRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.lecture.service.LectureService;
import com.pse.moderation.service.ModerationUserService;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.user.model.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Answers.RETURNS_DEEP_STUBS;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LectureServiceTests {


    @Mock
    private ModerationUserService moderationUserService;



    @Mock
    private LectureRepository lectureRepository;

    @Mock
    private ProfessorRepository professorRepository;

    @Mock
    private AuditWriter auditWriter;

    private LectureService lectureService;



    @BeforeEach
    void setUp() {
        lectureService = new LectureService(
                moderationUserService,
                lectureRepository,
                professorRepository,
                auditWriter
        );
    }


    /**
     * The principal the controller would hand in, built round the test's own student so the
     * {@code verifyAdmin} stubbing below still names the same object.
     */
    private static AuthenticatedUser principalFor(Student student) {
        return new AuthenticatedUser(student, null, mock(Admin.class));
    }

    @Test
    void getLectureReturnsFailureWhenLectureDoesNotExist() {

        UUID lectureId = UUID.randomUUID();

        when(lectureRepository.findById(lectureId)).thenReturn(Optional.empty());

        LectureDetailResponse response = lectureService.getLecture(lectureId);

        assertThat(response.success()).isFalse();
        assertThat(response.lecture()).isNull();

        verify(lectureRepository).findById(lectureId);
    }

    @Test
    void getLectureReturnsLectureWhenLectureExists() {

        UUID lectureId = UUID.randomUUID();

        Lecture lecture = mock(Lecture.class, RETURNS_DEEP_STUBS);

        when(lecture.getId()).thenReturn(lectureId);
        when(lecture.getName()).thenReturn("Lineare Algebra 1");
        when(lecture.getCode()).thenReturn("LA1");

        when(lectureRepository.findById(lectureId))
                .thenReturn(Optional.of(lecture));


        LectureDetailResponse response = lectureService.getLecture(lectureId);

        assertThat(response.success()).isTrue();
        assertThat(response.lecture()).isNotNull();

        assertThat(response.lecture().id()).isEqualTo(lectureId);
        assertThat(response.lecture().name()).isEqualTo("Lineare Algebra 1");
        assertThat(response.lecture().code()).isEqualTo("LA1");

        verify(lectureRepository).findById(lectureId);
    }

    @Test
    void getLecturesLoadsOnlyActiveLectures() {

        Lecture lecture = mock(Lecture.class, RETURNS_DEEP_STUBS);

        when(lectureRepository.findByActiveTrueOrderByNameAsc()).thenReturn(Set.of(lecture));

        LecturesResponse response = lectureService.getLectures();

        assertThat(response.success()).isTrue();
        assertThat(response.lectures().size()).isEqualTo(1);

        verify(lectureRepository).findByActiveTrueOrderByNameAsc();

        verify(lectureRepository, never()).findAllByOrderByNameAsc();
    }


    @Test
    void getAllLecturesLoadsActiveAndInactiveLectures() {

        // Arrange
        Lecture firstLecture = mock(Lecture.class, RETURNS_DEEP_STUBS);
        Lecture secondLecture = mock(Lecture.class, RETURNS_DEEP_STUBS);


        when(lectureRepository.findAllByOrderByNameAsc()).thenReturn(Set.of(firstLecture, secondLecture));

        LecturesResponse response = lectureService.getAllLectures();

        assertThat(response.success()).isTrue();
        assertThat(response.lectures().size()).isEqualTo(2);

        verify(lectureRepository).findAllByOrderByNameAsc();

        verify(lectureRepository, never()).findByActiveTrueOrderByNameAsc();


    }


    @Test
    void addLectureFailsWhenStudentIsNotAdmin() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(moderationUserService.verifyAdmin(student)).thenReturn(false);

        BasicResponse response = lectureService.addLecture(principalFor(student), request);


        assertThat(response.success()).isFalse();
        assertThat(response.message()).isEqualTo("User is not authorized to add lectures");

        verify(moderationUserService).verifyAdmin(student);

        verifyNoInteractions(lectureRepository);
        verifyNoInteractions(professorRepository);
    }

    @Test
    void addLectureFailsWhenLectureAlreadyExists() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(request.name()).thenReturn("Lineare Algebra 1");
        when(moderationUserService.verifyAdmin(student)).thenReturn(true);
        when(lectureRepository.findByName("Lineare Algebra 1")).thenReturn(Optional.of(mock(Lecture.class)));

        BasicResponse response = lectureService.addLecture(principalFor(student), request);


        assertThat(response.success()).isFalse();

        assertThat(response.message()).isEqualTo("Lecture already exists: Lineare Algebra 1");

        verify(lectureRepository).findByName("Lineare Algebra 1");
        verify(lectureRepository, never()).save(any());

        verifyNoInteractions(professorRepository);
    }

    @Test
    void addLectureFailsWhenProfessorDoesNotExist() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        UUID professorId = UUID.randomUUID();

        when(request.name()).thenReturn("Lineare Algebra 1");
        when(request.professorIds()).thenReturn(
                java.util.List.of(professorId)
        );

        when(moderationUserService.verifyAdmin(student)).thenReturn(true);

        when(lectureRepository.findByName("Lineare Algebra 1")).thenReturn(Optional.empty());

        when(professorRepository.findById(professorId)).thenReturn(Optional.empty());

        BasicResponse response = lectureService.addLecture(principalFor(student), request);

        assertThat(response.success()).isFalse();

        assertThat(response.message()).isEqualTo("Professor not found: " + professorId);

        verify(professorRepository).findById(professorId);

        verify(lectureRepository, never()).save(any());
    }

    @Test
    void addLectureSuccessfullyCreatesLecture() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        UUID professorId = UUID.randomUUID();

        Professor professor = mock(Professor.class, RETURNS_DEEP_STUBS);

        when(request.name()).thenReturn("Lineare Algebra 1");

        when(request.professorIds()).thenReturn(java.util.List.of(professorId));

        when(moderationUserService.verifyAdmin(student)).thenReturn(true);

        when(lectureRepository.findByName("Lineare Algebra 1")).thenReturn(Optional.empty());

        when(professorRepository.findById(professorId)).thenReturn(Optional.of(professor));

        BasicResponse response = lectureService.addLecture(principalFor(student), request);

        assertThat(response.success()).isTrue();

        assertThat(response.message()).isEqualTo("Successfully added Lectures");

        verify(professorRepository).save(professor);

        verify(lectureRepository).save(any(Lecture.class));
    }

    @Test
    void addLectureSuccessfullyCreatesLectureWithCorrectValues() {


        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        UUID professorId = UUID.randomUUID();

        Professor professor =
                mock(Professor.class, RETURNS_DEEP_STUBS);

        when(request.name()).thenReturn("Lineare Algebra 1");
        when(request.code()).thenReturn("LA1");
        when(request.semesterYear()).thenReturn(2026);
        when(request.professorIds()).thenReturn(java.util.List.of(professorId));

        when(moderationUserService.verifyAdmin(student))
                .thenReturn(true);

        when(lectureRepository.findByName("Lineare Algebra 1"))
                .thenReturn(Optional.empty());

        when(professorRepository.findById(professorId))
                .thenReturn(Optional.of(professor));

        ArgumentCaptor<Lecture> lectureCaptor =
                ArgumentCaptor.forClass(Lecture.class);



        BasicResponse response = lectureService.addLecture(principalFor(student), request);



        assertThat(response.success()).isTrue();

        verify(lectureRepository).save(lectureCaptor.capture());

        Lecture savedLecture = lectureCaptor.getValue();

        assertThat(savedLecture.getName()).isEqualTo("Lineare Algebra 1");

        assertThat(savedLecture.getCode()).isEqualTo("LA1");

        assertThat(savedLecture.getSemesterYear()).isEqualTo(2026);

        assertThat(savedLecture.isActive()).isTrue();

        assertThat(savedLecture.getProfessors().contains(professor)).isTrue();
    }

    @Test
    void getByIdReturnsNullWhenLectureDoesNotExist() {

        UUID id = UUID.randomUUID();

        when(lectureRepository.findById(id))
                .thenReturn(Optional.empty());

        Lecture result = lectureService.getById(id);

        assertThat(result).isNull();
    }

    @Test
    void getByIdReturnsLectureWhenItExists() {

        UUID id = UUID.randomUUID();
        Lecture lecture = mock(Lecture.class);

        when(lectureRepository.findById(id))
                .thenReturn(Optional.of(lecture));

        Lecture result = lectureService.getById(id);

        assertThat(result).isSameAs(lecture);

        verify(lectureRepository).findById(id);
    }





    /**
     * The audit gap this method used to have: updating or deleting a lecture wrote an entry and
     * creating one wrote nothing, so the record could show a rename with no sign of where the
     * row came from.
     *
     * <p>Pinned as a lifecycle event, not a field diff. {@code changes} is keyed {@code exists},
     * which is what {@code AuditRevertService.isFieldDiff} looks for to refuse the revert -- the
     * inverse of a creation is a deletion, which is its own audited action with its own guards.
     */
    @Test
    void addLectureRecordsTheCreationAsALifecycleEvent() {

        Student student = mock(Student.class);
        AuthenticatedUser principal = principalFor(student);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(request.name()).thenReturn("Lineare Algebra 1");
        when(request.professorIds()).thenReturn(java.util.List.of());
        when(moderationUserService.verifyAdmin(student)).thenReturn(true);
        when(lectureRepository.findByName("Lineare Algebra 1")).thenReturn(Optional.empty());

        assertThat(lectureService.addLecture(principal, request).success()).isTrue();

        ArgumentCaptor<java.util.Map<String, Object>> changes =
                ArgumentCaptor.forClass(java.util.Map.class);
        verify(auditWriter).write(
                eq(principal.admin()),
                eq(AuditAction.LECTURE_CREATED),
                eq(AuditTargetType.LECTURE),
                any(),
                eq("Lineare Algebra 1"),
                changes.capture(),
                any());

        assertThat(changes.getValue().get("exists"))
                .isEqualTo(java.util.Map.of("before", false, "after", true));
    }

    /** A refused creation must leave no trace: nothing was created, so nothing happened. */
    @Test
    void addLectureRecordsNothingWhenItRefuses() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(moderationUserService.verifyAdmin(student)).thenReturn(false);

        assertThat(lectureService.addLecture(principalFor(student), request).success()).isFalse();

        verifyNoInteractions(auditWriter);
    }
}
