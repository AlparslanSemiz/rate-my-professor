package com.pse.professor.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.professor.model.Professor;

public interface ProfessorRepository
        extends JpaRepository<Professor, UUID> {


    List<Professor> findByActiveTrueOrderByLastNameAscFirstNameAsc();
    
    
    
    }