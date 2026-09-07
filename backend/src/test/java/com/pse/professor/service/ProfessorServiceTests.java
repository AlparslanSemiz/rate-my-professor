package com.pse.professor.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.professor.dto.request.ProfessorAddRequest;
import com.pse.professor.dto.response.ProfessorDetailResponse;
import com.pse.professor.dto.response.ProfessorsResponse;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfessorServiceTests {

    @Mock
    private ProfessorRepository professorRepository;

    @Mock
    private LectureRepository lectureRepository;

    private ProfessorService professorService;

    @BeforeEach
    void setUp() {
        professorService = new ProfessorService(
                professorRepository,
                lectureRepository
        );
    }


    @Test
    void getProfessorsReturnsActiveProfessors() {

        Professor professor1 = createProfessor(
                "Stefan",
                "Kühnlein",
                true
        );

        Professor professor2 = createProfessor(
                "Müller",
                "Quade",
                true
        );

        Set<Professor> professors = new LinkedHashSet<>();
        professors.add(professor1);
        professors.add(professor2);

        when(professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc())
                .thenReturn(professors);


        ProfessorsResponse response = professorService.getProfessors();


        assertTrue(response.success());
        assertEquals("Found 2 professors", response.message());
        assertEquals(2, response.professors().size());

        verify(professorRepository)
                .findByActiveTrueOrderByLastNameAscFirstNameAsc();
    }


    @Test
    void getProfessorsReturnsEmptyListWhenNoActiveProfessorExists() {

        when(professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc())
                .thenReturn(Set.of());


        ProfessorsResponse response = professorService.getProfessors();


        assertTrue(response.success());
        assertEquals("Found 0 professors", response.message());
        assertTrue(response.professors().isEmpty());
    }



    @Test
    void getAllProfessorsReturnsAllProfessors() {

        Professor activeProfessor = createProfessor(
                "Stefan",
                "Kühnlein",
                true
        );

        Professor inactiveProfessor = createProfessor(
                "Müller",
                "Quade",
                false
        );

        Set<Professor> professors = new LinkedHashSet<>();
        professors.add(activeProfessor);
        professors.add(inactiveProfessor);

        when(professorRepository.findAllByOrderByLastNameAscFirstNameAsc())
                .thenReturn(professors);


        ProfessorsResponse response = professorService.getAllProfessors();


        assertTrue(response.success());
        assertEquals("Found 2 professors", response.message());
        assertEquals(2, response.professors().size());

        verify(professorRepository)
                .findAllByOrderByLastNameAscFirstNameAsc();
    }




    @Test
    void getProfessorReturnsProfessorWhenProfessorExists() {

        UUID professorId = UUID.randomUUID();

        Professor professor = createProfessor(
                "Stefan",
                "Kühnlein",
                true
        );

        professor.setId(professorId);

        when(professorRepository.findWithLecturesById(professorId))
                .thenReturn(Optional.of(professor));


        ProfessorDetailResponse response =
                professorService.getProfessor(professorId);


        assertTrue(response.success());
        assertEquals(
                "Found professor with uuid: " + professorId,
                response.message()
        );

        assertNotNull(response.professor());
        assertEquals(professorId, response.professor().id());
        assertEquals("Stefan", response.professor().firstName());
        assertEquals("Kühnlein", response.professor().lastName());

        verify(professorRepository)
                .findWithLecturesById(professorId);
    }


    @Test
    void getProfessorReturnsFailureWhenProfessorDoesNotExist() {

        UUID professorId = UUID.randomUUID();

        when(professorRepository.findWithLecturesById(professorId))
                .thenReturn(Optional.empty());


        ProfessorDetailResponse response =
                professorService.getProfessor(professorId);


        assertFalse(response.success());
        assertEquals(
                "Couldn't find prof with uuid: " + professorId,
                response.message()
        );

        assertNull(response.professor());
    }


    @Test
    void addProfessorDoesNotSaveWhenProfessorAlreadyExists() {

        UUID existingProfessorId = UUID.randomUUID();

        Professor existingProfessor = createProfessor(
                "Stefan",
                "Kühnlein",
                true
        );

        existingProfessor.setId(existingProfessorId);

        ProfessorAddRequest request = new ProfessorAddRequest(
                "Stefan",
                "Kühnlein",
                null
        );

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.of(existingProfessor));


        BasicResponse response =
                professorService.addProfessor(request);


        assertFalse(response.success());
        assertEquals(
                "Professor already exists: Stefan Kühnlein",
                response.message()
        );

        verify(professorRepository, never()).save(any());
        verifyNoInteractions(lectureRepository);
    }


    @Test
    void addProfessorDoesNotSaveWhenLectureDoesNotExist() {

        UUID lectureId = UUID.randomUUID();

        ProfessorAddRequest request = new ProfessorAddRequest(
                "Stefan",
                "Kühnlein",
                List.of(lectureId)
        );

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.empty());

        when(lectureRepository.findById(lectureId))
                .thenReturn(Optional.empty());


        BasicResponse response =
                professorService.addProfessor(request);


        assertFalse(response.success());
        assertEquals(
                "Couldn't find lecture with lectureID: " + lectureId,
                response.message()
        );

        verify(lectureRepository).findById(lectureId);

        verify(professorRepository, never()).save(any());
    }


    @Test
    void addProfessorSuccessfullyWithoutLectures() {

        ProfessorAddRequest request = new ProfessorAddRequest(
                "Stefan",
                "Kühnlein",
                null
        );

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.empty());


        BasicResponse response =
                professorService.addProfessor(request);


        assertTrue(response.success());
        assertEquals(
                "Professor added successfully",
                response.message()
        );

        ArgumentCaptor<Professor> professorCaptor =
                ArgumentCaptor.forClass(Professor.class);

        verify(professorRepository)
                .save(professorCaptor.capture());

        Professor savedProfessor = professorCaptor.getValue();

        assertEquals("Stefan", savedProfessor.getFirstName());
        assertEquals("Kühnlein", savedProfessor.getLastName());
        assertTrue(savedProfessor.getLectures().isEmpty());

        verifyNoInteractions(lectureRepository);
    }


    @Test
    void addProfessorSuccessfullyWithLecture() {

        UUID lectureId = UUID.randomUUID();

        Lecture lecture = new Lecture();
        lecture.setId(lectureId);

        ProfessorAddRequest request = new ProfessorAddRequest(
                "Stefan",
                "Kühnlein",
                List.of(lectureId)
        );

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.empty());

        when(lectureRepository.findById(lectureId))
                .thenReturn(Optional.of(lecture));


        BasicResponse response =
                professorService.addProfessor(request);


        assertTrue(response.success());
        assertEquals(
                "Professor added successfully",
                response.message()
        );

        ArgumentCaptor<Professor> professorCaptor =
                ArgumentCaptor.forClass(Professor.class);

        verify(professorRepository)
                .save(professorCaptor.capture());

        Professor savedProfessor = professorCaptor.getValue();

        assertEquals("Stefan", savedProfessor.getFirstName());
        assertEquals("Kühnlein", savedProfessor.getLastName());

        assertTrue(
                savedProfessor.getLectures().contains(lecture)
        );

        assertTrue(
                lecture.getProfessors().contains(savedProfessor)
        );

        verify(lectureRepository).findById(lectureId);
    }


    @Test
    void addProfessorLoadsAllLectures() {

        UUID lectureId1 = UUID.randomUUID();
        UUID lectureId2 = UUID.randomUUID();

        Lecture lecture1 = new Lecture();
        lecture1.setId(lectureId1);

        Lecture lecture2 = new Lecture();
        lecture2.setId(lectureId2);

        ProfessorAddRequest request = new ProfessorAddRequest(
                "Stefan",
                "Kühnlein",
                List.of(lectureId1, lectureId2)
        );

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.empty());

        when(lectureRepository.findById(lectureId1))
                .thenReturn(Optional.of(lecture1));

        when(lectureRepository.findById(lectureId2))
                .thenReturn(Optional.of(lecture2));


        BasicResponse response =
                professorService.addProfessor(request);


        assertTrue(response.success());

        ArgumentCaptor<Professor> professorCaptor =
                ArgumentCaptor.forClass(Professor.class);

        verify(professorRepository)
                .save(professorCaptor.capture());

        Professor savedProfessor = professorCaptor.getValue();

        assertEquals(2, savedProfessor.getLectures().size());

        assertTrue(savedProfessor.getLectures().contains(lecture1));
        assertTrue(savedProfessor.getLectures().contains(lecture2));

        assertTrue(lecture1.getProfessors().contains(savedProfessor));
        assertTrue(lecture2.getProfessors().contains(savedProfessor));
    }


    @Test
    void getProfessorIDReturnsIdWhenProfessorExists() {

        UUID professorId = UUID.randomUUID();

        Professor professor = createProfessor(
                "Stefan",
                "Kühnlein",
                true
        );

        professor.setId(professorId);

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.of(professor));


        UUID result =
                professorService.getProfessorID("Stefan", "Kühnlein");


        assertEquals(professorId, result);
    }


    @Test
    void getProfessorIDReturnsNullWhenProfessorDoesNotExist() {

        when(professorRepository.findByFirstNameAndLastName(
                "Stefan",
                "Kühnlein"
        )).thenReturn(Optional.empty());


        UUID result = professorService.getProfessorID("Stefan", "Kühnlein");


        assertNull(result);
    }




    private Professor createProfessor(
            String firstName,
            String lastName,
            boolean active
    ) {

        Professor professor = new Professor();

        professor.setId(UUID.randomUUID());
        professor.setFirstName(firstName);
        professor.setLastName(lastName);
        professor.setActive(active);

        return professor;
    }
}