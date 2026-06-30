package com.pse.lecture.controller;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/data")
public class LectureController {


    @Autowired
    private LectureService lectureService;


    @GetMapping("/lectures")
    public List<LectureResponse> getLectures() {

        List<Lecture> lectures = lectureService.findByActiveTrueOrderByNameAsc();

        List<LectureResponse> responses = new ArrayList<>();

        for (Lecture lecture : lectures) {

            responses.add(
                    new LectureResponse(
                            lecture.getId(),
                            lecture.getName(),
                            lecture.getCode(),
                            lecture.getSemesterYear(),
                            lecture.getSemesterSeason(),
                            lecture.isActive(),
                            lecture.getProfessor().getId(),
                            lecture.getProfessor().getFirstName(),
                            lecture.getProfessor().getLastName(),
                            lecture.getComments().size(),
                            lecture.getRatings().size()
                    )
            );
        }

        return responses;
    }


    /**
     * Interface for adding Lectures
     * AuthToken needs to be connected to an Admin
     * @param authHeader
     * @param request
     * @return
     */
    @PostMapping("/lecutres")
    public BasicResponse addLecture(@RequestHeader("Authorization") String authHeader, AddLectureRequest request) {

        if(lectureService.addLecture(authHeader, request)){
            return new BasicResponse("Successfully added lecture", true);
        }

        return new BasicResponse("Failed to add lecture", true);
    }



}
