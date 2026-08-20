package com.pse.professor.service;


import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.moderation.service.ModerationUserService;
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

    private final ModerationUserService moderationUserService;


    public ProfessorService(ProfessorRepository professorRepository, LectureRepository lectureRepository, ModerationUserService moderationUserService) {
        this.professorRepository = professorRepository;
        this.lectureRepository = lectureRepository;
        this.moderationUserService = moderationUserService;
    }

    // Transactional because the response carries lectureIds and Professor.lectures is the
    // lazy inverse side of the many-to-many. Open-in-view is disabled, so without a
    // transaction boundary here reading it throws LazyInitializationException.
    @Transactional(readOnly = true)
    public ProfessorsResponse getProfessors() {

        List<Professor> professors = professorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {
            responses.add(toResponse(professor));
        }

        return new ProfessorsResponse("Found " + responses.size() + " professors", true, responses);
    }


    // For the admin panel: getProfessors() filters to active=true, the same as the
    // student app's catalogue read, so a deactivated professor would otherwise be
    // unreachable from the panel to correct or reactivate.
    @Transactional(readOnly = true)
    public ProfessorsResponse getAllProfessors() {

        List<Professor> professors = professorRepository.findAllByOrderByLastNameAscFirstNameAsc();

        List<ProfessorResponse> responses = new ArrayList<>();

        for (Professor professor : professors) {
            responses.add(toResponse(professor));
        }

        return new ProfessorsResponse("Found " + responses.size() + " professors", true, responses);
    }



    @Transactional(readOnly = true)
    public ProfessorDetailResponse getProfessor(UUID professor_id) {

        Professor professor = professorRepository.findWithLecturesById(professor_id).orElse(null);
        if(professor == null) {
            return new ProfessorDetailResponse("Couldnt find prof with uuid: " + professor_id, false, null);
        }

        // success was hard-coded false on this success path, so a client that trusted the
        // flag treated every found professor as a miss.
        return new ProfessorDetailResponse(
                "Found professor with uuid: " + professor_id,
                true,
                toResponse(professor)
        );

    }

    private ProfessorResponse toResponse(Professor professor) {
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

    public BasicResponse addProfessor(
        String authHeader,
        ProfessorAddRequest request
) {

    if (!moderationUserService.validateAdminToken(authHeader)) {
        return new BasicResponse(
                "Error, not authorized to add professors (must be admin)",
                false
        );
    }

    if (getProfessorID(request.firstName(), request.lastName()) != null) {
        return new BasicResponse(
                "Professor already exists: "
                        + request.firstName()
                        + " "
                        + request.lastName(),
                false
        );
    }

    Professor professor = new Professor();
    professor.setFirstName(request.firstName().trim());
    professor.setLastName(request.lastName().trim());

    // Zuerst speichern, damit der Professor eine ID hat
    professorRepository.save(professor);

    if (request.lectureIDs() != null) {

        for (UUID lectureID : request.lectureIDs()) {

            Lecture lecture = lectureRepository
                    .findById(lectureID)
                    .orElse(null);

            if (lecture == null) {
                return new BasicResponse(
                        "Couldn't find lecture with lectureID: " + lectureID,
                        false
                );
            }

            // Beide Seiten der Many-to-Many-Beziehung aktualisieren
            if (!lecture.getProfessors().contains(professor)) {
                lecture.getProfessors().add(professor);
            }

            if (!professor.getLectures().contains(lecture)) {
                professor.getLectures().add(lecture);
            }

            lectureRepository.save(lecture);
        }
    }

    professorRepository.save(professor);

    return new BasicResponse(
            "Professor added successfully",
            true
    );
}


    public void linkLectureToProf(Professor professor, Lecture lecture) {
        professor.getLectures().add(lecture);
        professorRepository.save(professor);
    }

    public UUID getProfessorID(String firstName, String lastName) {

        Professor professor = professorRepository.findByFirstNameAndLastName(firstName, lastName).orElse(null);

        if(professor == null) {
            return null;
        }

        return professor.getId();
    }
}
