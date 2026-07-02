package com.pse.lecture.controller;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.service.LectureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/data")
public class LectureController {


    @Autowired
    private LectureService lectureService;


    @GetMapping("/lectures")
    public LecturesResponse getLectures() {

        return lectureService.getLectures();
        
    }


    @GetMapping("/professor/{lecture_id}")
    public LectureDetailResponse getLecture(@PathVariable UUID lecture_id) {

        return lectureService.getLecture(lecture_id);

    }


    /**
     * Interface for adding Lectures
     * AuthToken needs to be connected to an Admin
     * @param authHeader
     * @param request
     * @return
     */
    @PostMapping("/lectures")
    public BasicResponse addLecture(@RequestHeader("Authorization") String authHeader, AddLectureRequest request) {

        return lectureService.addLecture(authHeader, request);

    }



}
