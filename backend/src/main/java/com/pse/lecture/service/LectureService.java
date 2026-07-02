package com.pse.lecture.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.service.ModerationUserService;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.professor.service.ProfessorService;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class LectureService {


    @Autowired
    private LectureRepository lectureRepository;
    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private ModerationUserService moderationUserService;
    @Autowired
    private AuthService authService;


    public LecturesResponse getLectures() {

        List<Lecture> lectures = lectureRepository.findByActiveTrueOrderByNameAsc();

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

        return new LecturesResponse("Found " + responses.size() + " lectures", true, responses);
    }


    public LectureDetailResponse getLecture(UUID lectureId) {

        Lecture lecture = lectureRepository.findById(lectureId).orElse(null);

        if(lecture == null){
            return new LectureDetailResponse("Couldn find lecture with uuid: " + lectureId, false, null);
        }

        LectureResponse lectureResponse = new LectureResponse(
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
        );


        return new LectureDetailResponse("Found lecture", true, lectureResponse);
    }

    public BasicResponse addLecture(String authHeader, AddLectureRequest request) {

        Student student = authService.verifyUser(authHeader);
        if(!(student != null && moderationUserService.verifyAdmin(student))){
            return new BasicResponse("User is not authorized to add Lectures (isnt Admin)", false);
        }

        Professor professor = professorRepository.findById(request.professorId()).orElse(null);

        if(professor == null){
            return new BasicResponse("Professor not found", false);
        }

        Lecture lecture = new Lecture();

        lecture.setName(request.name());
        lecture.setCode(request.code());
        lecture.setSemesterYear(request.semesterYear());
        lecture.setSemesterSeason(request.semesterSeason());
        lecture.setActive(true);

        //Link Prof to lecture
        if(request.professorId() != null){

            lecture.setProfessor(professor);
            professor.getLectures().add(lecture);

        }

        lectureRepository.save(lecture);
        professorRepository.save(professor);

        return new BasicResponse("Successfully added Lectures", true);
    }



    public Lecture findById(UUID id) {
        return lectureRepository.findById(id).orElse(null);
    }


    public Lecture getLectureByID(String lectureID) {

        return lectureRepository.findById(UUID.fromString(lectureID)).orElse(null);
    }





}
