package com.pse.professor.controller;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.professor.dto.request.ProfessorAddRequest;
import com.pse.professor.dto.response.ProfessorDetailResponse;
import com.pse.professor.dto.response.ProfessorsResponse;
import com.pse.professor.service.ProfessorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;


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


    @PostMapping("/professor")
    public BasicResponse addProfessor(@RequestHeader("Authorization") String authHeader, @RequestBody ProfessorAddRequest request){

        return professorService.addProfessor(authHeader, request);

    }








}
