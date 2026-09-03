package com.pse.lecture;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

    private LectureService lectureService;



    @BeforeEach
    void setUp() {
        lectureService = new LectureService(
                moderationUserService,
                lectureRepository,
                professorRepository
        );
    }


    @Test
    void getLectureReturnsFailureWhenLectureDoesNotExist() {

        UUID lectureId = UUID.randomUUID();

        when(lectureRepository.findById(lectureId)).thenReturn(Optional.empty());

        LectureDetailResponse response = lectureService.getLecture(lectureId);

        assertFalse(response.success());
        assertNull(response.lecture());

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

        assertTrue(response.success());
        assertNotNull(response.lecture());

        assertEquals(lectureId, response.lecture().id());
        assertEquals("Lineare Algebra 1", response.lecture().name());
        assertEquals("LA1", response.lecture().code());

        verify(lectureRepository).findById(lectureId);
    }

    @Test
    void getLecturesLoadsOnlyActiveLectures() {

        Lecture lecture = mock(Lecture.class, RETURNS_DEEP_STUBS);

        when(lectureRepository.findByActiveTrueOrderByNameAsc()).thenReturn(Set.of(lecture));

        LecturesResponse response = lectureService.getLectures();

        assertTrue(response.success());
        assertEquals(1, response.lectures().size());

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

        assertTrue(response.success());
        assertEquals(2, response.lectures().size());

        verify(lectureRepository).findAllByOrderByNameAsc();

        verify(lectureRepository, never()).findByActiveTrueOrderByNameAsc();


    }


    @Test
    void addLectureFailsWhenStudentIsNotAdmin() {

        Student student = mock(Student.class);
        AddLectureRequest request = mock(AddLectureRequest.class);

        when(moderationUserService.verifyAdmin(student)).thenReturn(false);

        BasicResponse response = lectureService.addLecture(student, request);


        assertFalse(response.success());
        assertEquals("User is not authorized to add lectures", response.message());

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

        BasicResponse response = lectureService.addLecture(student, request);


        assertFalse(response.success());

        assertEquals(
                "Lecture already exists: Analysis 1",
                response.message()
        );

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

        when(professorRepository.existsById(professorId)).thenReturn(false);

        BasicResponse response = lectureService.addLecture(student, request);

        assertFalse(response.success());

        assertEquals(
                "Professor not found: " + professorId,
                response.message()
        );

        verify(professorRepository).existsById(professorId);

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

        when(professorRepository.existsById(professorId)).thenReturn(true);

        when(professorRepository.findById(professorId)).thenReturn(Optional.of(professor));

        BasicResponse response = lectureService.addLecture(student, request);

        assertTrue(response.success());

        assertEquals(
                "Successfully added Lectures",
                response.message()
        );

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

        when(professorRepository.existsById(professorId))
                .thenReturn(true);

        when(professorRepository.findById(professorId))
                .thenReturn(Optional.of(professor));

        ArgumentCaptor<Lecture> lectureCaptor =
                ArgumentCaptor.forClass(Lecture.class);



        BasicResponse response = lectureService.addLecture(student, request);



        assertTrue(response.success());

        verify(lectureRepository).save(lectureCaptor.capture());

        Lecture savedLecture = lectureCaptor.getValue();

        assertEquals("Lineare Algebra 1", savedLecture.getName());

        assertEquals("LA1", savedLecture.getCode());

        assertEquals(2026, savedLecture.getSemesterYear());

        assertTrue(savedLecture.isActive());

        assertTrue(savedLecture.getProfessors().contains(professor));
    }

    @Test
    void getByIdReturnsNullWhenLectureDoesNotExist() {

        UUID id = UUID.randomUUID();

        when(lectureRepository.findById(id))
                .thenReturn(Optional.empty());

        Lecture result = lectureService.getById(id);

        assertNull(result);
    }

    @Test
    void getByIdReturnsLectureWhenItExists() {

        UUID id = UUID.randomUUID();
        Lecture lecture = mock(Lecture.class);

        when(lectureRepository.findById(id))
                .thenReturn(Optional.of(lecture));

        Lecture result = lectureService.getById(id);

        assertSame(lecture, result);

        verify(lectureRepository).findById(id);
    }




}
