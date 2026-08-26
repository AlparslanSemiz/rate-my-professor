package com.pse.professor.controller;


import java.util.UUID;

import com.pse.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.professor.dto.request.ProfessorAddRequest;
import com.pse.professor.dto.response.ProfessorDetailResponse;
import com.pse.professor.dto.response.ProfessorsResponse;
import com.pse.professor.service.ProfessorService;

@RestController
@RequestMapping("/data")
public class ProfessorController {


    private final ProfessorService professorService;


    public ProfessorController(ProfessorService professorService) {
        this.professorService = professorService;
    }

    @GetMapping("/professor")
    public ProfessorsResponse getProfessors() {
        return professorService.getProfessors();
    }

    @GetMapping("/professor/{professor_id}")
    public ProfessorDetailResponse getProfessor(@PathVariable UUID professor_id) {
        return professorService.getProfessor(professor_id);
    }


    /**
     * SECURED [NEEDS ADMIN]
     * @param request
     * @return
     */
    @PostMapping("/professor")
    public BasicResponse addProfessor(@Valid @RequestBody ProfessorAddRequest request) {
        return professorService.addProfessor(request);
    }


    /**
     * Used for adding Lecture.
     * First, add all professors, then add get IDs for them, and then add lectures
     * @param firstName of Prof
     * @param lastName of Prof
     * @return the UUID of Prof
     */
    @GetMapping("/professor/id")
    public UUID getProfessorID( @RequestParam String firstName, @RequestParam String lastName) {
        return professorService.getProfessorID(firstName, lastName);
    }






}
