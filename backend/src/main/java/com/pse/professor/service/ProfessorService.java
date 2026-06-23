package com.pse.professor.service;


import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;


    public List<Professor> findByActiveTrueOrderByLastNameAscFirstNameAsc(){
        return professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();
    }

}
