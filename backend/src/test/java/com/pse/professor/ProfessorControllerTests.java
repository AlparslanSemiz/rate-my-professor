package com.pse.professor;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.professor.controller.ProfessorController;
import com.pse.professor.dto.request.ProfessorAddRequest;
import com.pse.professor.dto.response.ProfessorDetailResponse;
import com.pse.professor.dto.response.ProfessorsResponse;
import com.pse.professor.service.ProfessorService;

import com.pse.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfessorControllerTests {


    @Mock
    private ProfessorService professorService;

    @InjectMocks
    private ProfessorController professorController;


    @Test
    void getProfessorsReturnsServiceResponse() {

        ProfessorsResponse expectedResponse = mock(ProfessorsResponse.class);

        when(professorService.getProfessors())
                .thenReturn(expectedResponse);


        ProfessorsResponse response = professorController.getProfessors();


        assertSame(expectedResponse, response);

        verify(professorService).getProfessors();
    }


    @Test
    void getProfessorReturnsServiceResponse() {

        UUID professorId = UUID.randomUUID();

        ProfessorDetailResponse expectedResponse =
                mock(ProfessorDetailResponse.class);

        when(professorService.getProfessor(professorId))
                .thenReturn(expectedResponse);


        ProfessorDetailResponse response =
                professorController.getProfessor(professorId);


        assertSame(expectedResponse, response);

        verify(professorService).getProfessor(professorId);
    }


    @Test
    void addProfessorPassesRequestToService() {

        AuthenticatedUser principal = mock(AuthenticatedUser.class);
        ProfessorAddRequest request = mock(ProfessorAddRequest.class);

        BasicResponse expectedResponse =
                new BasicResponse(
                        "Professor added successfully",
                        true
                );
        when(principal.isAdmin()).thenReturn(true);

        when(professorService.addProfessor(request))
                .thenReturn(expectedResponse);


        BasicResponse response = professorController.addProfessor(principal, request);


        assertSame(expectedResponse, response);

        verify(principal).isAdmin();
        verify(professorService).addProfessor(request);
    }

    @Test
    void addProfessorDoesNotCallServiceWhenUserIsNotAdmin() {

        AuthenticatedUser principal = mock(AuthenticatedUser.class);
        ProfessorAddRequest request = mock(ProfessorAddRequest.class);

        when(principal.isAdmin()).thenReturn(false);


        BasicResponse response =
                professorController.addProfessor(
                        principal,
                        request
                );


        assertFalse(response.success());
        assertEquals(
                "Error, couldnt authenticate Admin",
                response.message()
        );

        verify(principal).isAdmin();
        verifyNoInteractions(professorService);
    }


    @Test
    void getProfessorIDPassesNamesToService() {

        UUID professorId = UUID.randomUUID();

        when(professorService.getProfessorID("Stefan", "Kühnlein"))
                .thenReturn(professorId);


        UUID response =
                professorController.getProfessorID(
                        "Stefan",
                        "Kühnlein"
                );


        assertSame(professorId, response);

        verify(professorService)
                .getProfessorID("Stefan", "Kühnlein");
    }
}