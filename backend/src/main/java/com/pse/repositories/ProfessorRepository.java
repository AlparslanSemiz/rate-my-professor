package com.pse.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.model.Professor;

public interface ProfessorRepository
        extends JpaRepository<Professor, UUID> {


    List<Professor> findByActiveTrueOrderByLastNameAscFirstNameAsc();
    
    
    
    }