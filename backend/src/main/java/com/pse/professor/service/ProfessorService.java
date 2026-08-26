package com.pse.professor.service;


import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.pse.professor.dto.response.ProfessorShortResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.professor.dto.request.ProfessorAddRequest;
import com.pse.professor.dto.response.ProfessorDetailResponse;
import com.pse.professor.dto.response.ProfessorResponse;
import com.pse.professor.dto.response.ProfessorsResponse;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;

@Service
public class ProfessorService {

    private final ProfessorRepository professorRepository;
    private final LectureRepository lectureRepository;



    public ProfessorService(ProfessorRepository professorRepository, LectureRepository lectureRepository) {
        this.professorRepository = professorRepository;
        this.lectureRepository = lectureRepository;
    }


    @Transactional(readOnly = true)
    public ProfessorsResponse getProfessors() {

        Set<Professor> professors = professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {
            responses.add(createProfessorResponse(professor));
        }

        return new ProfessorsResponse("Found " + responses.size() + " professors", true, responses);
    }


    @Transactional(readOnly = true)
    public ProfessorsResponse getAllProfessors() {

        Set<Professor> professors = professorRepository.findAllByOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {
            responses.add(createProfessorResponse(professor));
        }

        return new ProfessorsResponse("Found " + responses.size() + " professors", true, responses);
    }



    @Transactional(readOnly = true)
    public ProfessorDetailResponse getProfessor(UUID professor_id) {

        Professor professor = professorRepository.findWithLecturesById(professor_id).orElse(null);
        if(professor == null) {
            return new ProfessorDetailResponse("Couldnt find prof with uuid: " + professor_id, false, null);
        }


        return new ProfessorDetailResponse(
                "Found professor with uuid: " + professor_id,
                true,
                createProfessorResponse(professor)
        );

    }


    @Transactional
    public BasicResponse addProfessor(ProfessorAddRequest request) {

    if (getProfessorID(request.firstName(), request.lastName()) != null) {
        return new BasicResponse(
                "Professor already exists: "
                        + request.firstName()
                        + " "
                        + request.lastName(),
                false
        );
    }

    List<Lecture> lectures = new ArrayList<>();
        if (request.lectureIDs() != null) {
            for (UUID lectureId : request.lectureIDs()) {

                Lecture lecture = lectureRepository.findById(lectureId).orElse(null);

                if (lecture == null) {
                    return new BasicResponse(
                            "Couldn't find lecture with lectureID: " + lectureId,
                            false
                    );
                }

                lectures.add(lecture);
            }
        }

        Professor professor = new Professor();
        professor.setFirstName(request.firstName().trim());
        professor.setLastName(request.lastName().trim());

        for (Lecture lecture : lectures) {
            lecture.getProfessors().add(professor);
            professor.getLectures().add(lecture);
        }

        professorRepository.save(professor);

        return new BasicResponse("Professor added successfully", true);
    }



    public static ProfessorResponse createProfessorResponse(Professor professor) {
        return new ProfessorResponse(
                professor.getId(),
                professor.getFirstName(),
                professor.getLastName(),
                professor.isActive(),
                professor.getAverageRating(),
                professor.getRatingCount(),
                professor.getLectures().stream().map(Lecture::getId).toList()
        );
    }



    public static ProfessorShortResponse createProfessorShortResponse(Professor professor) {
        return new ProfessorShortResponse(
                professor.getId(),
                professor.getFirstName(),
                professor.getLastName(),
                professor.isActive()
        );
    }


    public UUID getProfessorID(String firstName, String lastName) {
        Professor professor = professorRepository.findByFirstNameAndLastName(firstName, lastName).orElse(null);
        if(professor == null) {
            return null;
        }
        return professor.getId();
    }


}
