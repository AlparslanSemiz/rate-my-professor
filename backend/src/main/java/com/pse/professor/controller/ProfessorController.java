package com.pse.professor.controller;



import com.pse.professor.model.Professor;
import com.pse.professor.dto.response.ProfessorResponse;
import com.pse.professor.service.ProfessorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/data")
public class ProfessorController {


    @Autowired
    private ProfessorService professorService;

    @GetMapping("/professor")
    public List<ProfessorResponse> getProfessors() {


        List<Professor> professors =
                professorService.findByActiveTrueOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {

            responses.add(
                    new ProfessorResponse(
                            professor.getId(),
                            professor.getFirstName(),
                            professor.getLastName(),
                            professor.getAverageRating(),
                            professor.getRatingCount()
                    )
            );
        }

        return responses;
    }

}
