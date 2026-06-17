package com.pse;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.response.LectureResponse;
import com.pse.response.ProfessorResponse;



@RestController
@RequestMapping("/data")
public class SearchController {

    @Autowired
    private DatabaseService database;

    @GetMapping("/professor")
    public List<ProfessorResponse> getProfessors() {
        
        return database.getProfessors();
    }

    @GetMapping("/lectures")
    public List<LectureResponse> getLectures() {
        
        return database.getLectures();
    }







}