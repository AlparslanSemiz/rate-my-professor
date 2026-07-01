package com.pse.professor.service;


import com.pse.professor.dto.response.ProfessorResponse;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;


    public List<ProfessorResponse> getProfessors() {

        List<Professor> professors = professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();

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




    public Professor findById(UUID uuid) {
        return professorRepository.findById(uuid).orElse(null);
    }


}
