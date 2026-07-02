package com.pse.professor.service;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.moderation.service.ModerationUserService;
import com.pse.professor.dto.request.ProfessorAddRequest;
import com.pse.professor.dto.response.ProfessorDetailResponse;
import com.pse.professor.dto.response.ProfessorResponse;
import com.pse.professor.dto.response.ProfessorsResponse;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;
    @Autowired
    private LectureService lectureService;
    @Autowired
    private ModerationUserService moderationUserService;


    public ProfessorsResponse getProfessors() {

        List<Professor> professors = professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {

            responses.add(
                    new ProfessorResponse(
                            professor.getId(),
                            professor.getFirstName(),
                            professor.getLastName(),
                            professor.getAverageRating(),
                            professor.getRatingCount()
                    )
            );
        }

        return new ProfessorsResponse("Found" + responses.size() + " professors", true, responses);
    }




    public Professor findById(UUID uuid) {
        return professorRepository.findById(uuid).orElse(null);
    }


    public ProfessorDetailResponse getProfessor(UUID professor_id) {

        Professor professor = professorRepository.findById(professor_id).orElse(null);
        if(professor == null) {
            return new ProfessorDetailResponse("Couldnt find prof with uuid: " + professor_id, false, null);
        }

        ProfessorResponse professorResponse = new ProfessorResponse(
                professor.getId(),
                professor.getFirstName(),
                professor.getLastName(),
                professor.getAverageRating(),
                professor.getRatingCount()
        );


        return new ProfessorDetailResponse("Found professor with uuid: " + professor_id, false, professorResponse);

    }

    public BasicResponse addProfessor(String authHeader, ProfessorAddRequest request) {

        if (!moderationUserService.validateAdminToken(authHeader)) {
            return new BasicResponse("Error, not authorized to add professors (must be admin)", false);
        }

        Professor professor = new Professor();
        professor.setFirstName(request.firstName());
        professor.setLastName(request.lastName());

        if (request.lectureIDs() != null) {
            for (UUID lectureID : request.lectureIDs()) {

                Lecture lecture = lectureService.findById(lectureID);

                if (lecture == null) {
                    return new BasicResponse(
                            "Couldnt find lecture with lectureID: " + lectureID,
                            false
                    );
                }

                // link Prof <=> Lecture
                lectureService.linkProfToLecture(professor, lecture);
                professor.getLectures().add(lecture);
            }
        }

        professorRepository.save(professor);

        return new BasicResponse("Professor added successfully", true);
    }


    public void linkLectureToProf(Professor professor, Lecture lecture) {
        professor.getLectures().add(lecture);
        professorRepository.save(professor);
    }
}
