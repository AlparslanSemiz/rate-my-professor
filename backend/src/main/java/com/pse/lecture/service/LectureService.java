package com.pse.lecture.service;

import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class LectureService {


    @Autowired
    private LectureRepository lectureRepository;


    public List<Lecture> findByActiveTrueOrderByNameAsc(){
        return lectureRepository.findByActiveTrueOrderByNameAsc();
    }


    public Lecture getLectureByID(String lectureID) {

        return lectureRepository.findById(UUID.fromString(lectureID))
                .orElse(null);
    }
}
