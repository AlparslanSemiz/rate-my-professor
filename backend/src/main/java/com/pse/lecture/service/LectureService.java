package com.pse.lecture.service;

import com.pse.auth.service.TokenService;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.service.ModerationService;
import com.pse.professor.model.Professor;
import com.pse.professor.service.ProfessorService;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class LectureService {


    @Autowired
    private LectureRepository lectureRepository;

    @Autowired
    private ModerationService moderationService;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private ProfessorService professorService;

    public List<Lecture> findByActiveTrueOrderByNameAsc(){
        return lectureRepository.findByActiveTrueOrderByNameAsc();
    }


    public Lecture getLectureByID(String lectureID) {

        return lectureRepository.findById(UUID.fromString(lectureID))
                .orElse(null);
    }

    public boolean addLecture(String authHeader, AddLectureRequest request) {

        Student student = tokenService.verifyUser(authHeader);
        if(!(student != null && moderationService.verifyAdmin(student))){
            return false; //User is not authorized to add Lectures (isnt Admin)
        }

        Professor professor = professorService.findById(request.professorId());

        if(professor == null){
            return false;
        }

        Lecture lecture = new Lecture();

        lecture.setName(request.name());
        lecture.setCode(request.code());
        lecture.setSemesterYear(request.semesterYear());
        lecture.setSemesterSeason(request.semesterSeason());
        lecture.setActive(true);
        lecture.setProfessor(professor);
        lectureRepository.save(lecture);

        return true;
    }



}
