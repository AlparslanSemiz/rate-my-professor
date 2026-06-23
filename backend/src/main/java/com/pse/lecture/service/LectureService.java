package com.pse.lecture.service;

import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LectureService {


    @Autowired
    private LectureRepository lectureRepository;


    public List<Lecture> findByActiveTrueOrderByNameAsc(){
        return lectureRepository.findByActiveTrueOrderByNameAsc();
    }


}
