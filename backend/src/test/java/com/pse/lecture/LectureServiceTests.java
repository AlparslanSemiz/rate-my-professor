package com.pse.lecture;


import com.pse.shared.dto.BasicResponse;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.model.Lecture;
import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.moderation.model.Admin;
import com.pse.lecture.repository.LectureRepository;
import com.pse.security.AuthenticatedUser;
import com.pse.shared.error.ApiException;
import com.pse.lecture.service.LectureService;
import com.pse.professor.model.Professor;
import com.pse.shared.enums.SemesterSeason;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.user.model.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    private LectureRepository lectureRepository;

    @Mock
    private ProfessorRepository professorRepository;

    @Mock
    private AuditWriter auditWriter;

    private LectureService lectureService;



    @BeforeEach
    void setUp() {
        lectureService = new LectureService(
                lectureRepository,
                professorRepository,
                auditWriter
        );
    }


    /** The principal the controller would hand in. */
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
    void addLectureFailsWhenLectureAlreadyExists() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(request.name()).thenReturn("Lineare Algebra 1");
        when(lectureRepository.findByName("Lineare Algebra 1")).thenReturn(Optional.of(mock(Lecture.class)));

        assertThatThrownBy(() -> lectureService.addLecture(principalFor(student), request))
                .isInstanceOf(ApiException.class)
                .hasMessage("Lecture already exists: Lineare Algebra 1")
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);

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

        when(lectureRepository.findByName("Lineare Algebra 1")).thenReturn(Optional.empty());

        when(professorRepository.findById(professorId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lectureService.addLecture(principalFor(student), request))
                .isInstanceOf(ApiException.class)
                .hasMessage("Professor not found: " + professorId)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);

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

    /**
     * A refused creation must leave no trace: nothing was created, so nothing happened.
     *
     * <p>The refusal used here is a duplicate name. It used to be a non-admin principal, which
     * stopped being a refusal the service can reach at all once the unreachable role check came
     * out -- {@code SecurityConfig} refuses that request before the service is called.
     */
    @Test
    void addLectureRecordsNothingWhenItRefuses() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(request.name()).thenReturn("Lineare Algebra 1");
        when(lectureRepository.findByName("Lineare Algebra 1"))
                .thenReturn(Optional.of(mock(Lecture.class)));

        assertThatThrownBy(() -> lectureService.addLecture(principalFor(student), request))
                .isInstanceOf(ApiException.class);

        verifyNoInteractions(auditWriter);
    }

    // ---------- createLectureResponse: order, label and title ----------

    /**
     * A lecture with its teaching staff in a {@code LinkedHashSet} in the wrong order.
     *
     * <p>{@code LinkedHashSet} on purpose, and this is the point of the whole fixture: the
     * defect is that {@code Lecture.professors} is a {@code Set} whose order is undefined, and
     * a test that fed it a real {@code HashSet} and asserted on what came out would be
     * asserting on identity-hash order -- flaky, and it would put the flakiness in the test
     * rather than in the defect. A {@code LinkedHashSet} states the input order exactly, so a
     * response that comes back in it has not been sorted, and one that comes back in name
     * order has. This is how BUG-3's tests were built for the same reason.
     */
    private static Lecture lectureTaughtBy(Professor... professors) {
        Lecture lecture = new Lecture();
        lecture.setName("Algorithmen 1");
        lecture.setSemesterYear(2026);
        lecture.setSemesterSeason(SemesterSeason.SS);
        lecture.setProfessors(new LinkedHashSet<>(java.util.Arrays.asList(professors)));
        return lecture;
    }

    private static Professor professor(String firstName, String lastName) {
        Professor professor = new Professor();
        professor.setFirstName(firstName);
        professor.setLastName(lastName);
        return professor;
    }

    @Test
    void createLectureResponse_professorsInAnyOrder_answersThemByName() {

        Lecture lecture = lectureTaughtBy(
                professor("Peter", "Sanders"),
                professor("Anna", "Bauer"),
                professor("Chris", "Abt")
        );

        LectureResponse response = LectureService.createLectureResponse(lecture);


        assertThat(response.professors())
                .extracting(professor -> professor.firstName() + " " + professor.lastName())
                .containsExactly("Chris Abt", "Anna Bauer", "Peter Sanders");
    }

    /** Two people with the same surname are still ordered, and always the same way. */
    @Test
    void createLectureResponse_sameLastName_ordersByFirstName() {

        Lecture lecture = lectureTaughtBy(
                professor("Peter", "Sanders"),
                professor("Anna", "Sanders")
        );

        LectureResponse response = LectureService.createLectureResponse(lecture);


        assertThat(response.professors())
                .extracting(professor -> professor.firstName() + " " + professor.lastName())
                .containsExactly("Anna Sanders", "Peter Sanders");
    }

    @Test
    void createLectureResponse_carriesTheSemesterLabelAndTheTitle() {

        Lecture lecture = lectureTaughtBy(
                professor("Uebungsleiter", "2"),
                professor("Peter", "Sanders"),
                professor("Uebungsleiter", "1")
        );

        LectureResponse response = LectureService.createLectureResponse(lecture);


        assertThat(response.semesterLabel()).isEqualTo("SS26");
        assertThat(response.title())
                .isEqualTo("SS26 Algorithmen 1 \u2014 Uebungsleiter 1, Uebungsleiter 2, Peter Sanders");
    }

    /** A winter lecture is the case a client formatting this itself gets wrong. */
    @Test
    void createLectureResponse_winterSemester_labelsBothYears() {

        Lecture lecture = lectureTaughtBy();
        lecture.setSemesterSeason(SemesterSeason.WS);
        lecture.setSemesterYear(2025);

        LectureResponse response = LectureService.createLectureResponse(lecture);


        assertThat(response.semesterLabel()).isEqualTo("WS25/26");
        assertThat(response.title()).isEqualTo("WS25/26 Algorithmen 1");
    }

    /** No staff, no separator: a title ending in a dash reads as a bug to whoever sees it. */
    @Test
    void createLectureResponse_lectureWithNobodyAssigned_endsAfterTheName() {

        LectureResponse response =
                LectureService.createLectureResponse(lectureTaughtBy());


        assertThat(response.professors()).isEmpty();
        assertThat(response.title()).isEqualTo("SS26 Algorithmen 1");
    }
}
