package com.pse.lecture.controller;


import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.service.LectureService;

@RestController
@RequestMapping("/data")
public class LectureController {


    private final LectureService lectureService;

    public LectureController(LectureService lectureService) {
        this.lectureService = lectureService;
    }

    @GetMapping("/lectures")
    public LecturesResponse getLectures() {
        return lectureService.getLectures();
    }


    // Was mapped to "/professor/{lecture_id}" — an exact path collision with
    // ProfessorController's "/data/professor/{professor_id}". Spring can't pick
    // between them at request time and throws "Ambiguous handler methods
    // mapped", so this endpoint 500'd unconditionally, for every id, always.
    @GetMapping("/lectures/{lecture_id}")
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
    public BasicResponse addLecture(@RequestHeader("Authorization") String authHeader, @RequestBody AddLectureRequest request) {
        return lectureService.addLecture(authHeader, request);
    }



}
