package com.pse.lecture.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.pse.professor.service.ProfessorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.pse.user.model.Student;
import com.pse.professor.dto.response.ProfessorShortResponse;


/**
 * Service for Lectures.
 *
 */
@Service
public class LectureService {


    private final ModerationUserService moderationUserService;

    private final LectureRepository lectureRepository;
    private final ProfessorRepository professorRepository;

    public LectureService(ModerationUserService moderationUserService, LectureRepository lectureRepository, ProfessorRepository professorRepository ) {
        this.moderationUserService = moderationUserService;
        this.lectureRepository = lectureRepository;
        this.professorRepository = professorRepository;
    }


    /**
     * Searches only for Lectures which are active.
     * @return all active Lectures.
     */
    @Transactional(readOnly = true)
    public LecturesResponse getLectures() {

        return getLectures(false);
    }


    /**
     * Used by Admin Panel.
     * Searches for all Lectures (including non-active Lectures)
     * @return all Lectures
     */
    @Transactional(readOnly = true)
    public LecturesResponse getAllLectures() {

        return getLectures(true);
    }

    /**
     * Retrieves a Lecture with a given ID
     * @param lectureId UUID
     * @return LectureDetailResponse
     */
    @Transactional(readOnly = true)
    public LectureDetailResponse getLecture(UUID lectureId) {

        Lecture lecture = lectureRepository.findById(lectureId).orElse(null);

        if(lecture == null){
            return new LectureDetailResponse("Couldn find lecture with uuid: " + lectureId, false, null);
        }

        LectureResponse lectureResponse = createLectureResponse(lecture);

        return new LectureDetailResponse("Found lecture", true, lectureResponse);
    }


    public BasicResponse addLecture(Student student, AddLectureRequest request) {

        if (!moderationUserService.verifyAdmin(student)) {
            return new BasicResponse("User is not authorized to add lectures", false
            );
        }

        if (lectureRepository.findByName(request.name()).isPresent()) {
            return new BasicResponse("Lecture already exists: " + request.name(),false);
        }


        List<UUID> professorsIDs = request.professorIds();
        Set<Professor> professors = new HashSet<>();

        //Validate professorIDs exist
        for (UUID professorID: professorsIDs){

            Professor professor = professorRepository.findById(professorID).orElse(null);

            if (professor == null) {
                return new BasicResponse(
                        "Professor not found: " + professorID,
                        false
                );
            }

            professors.add(professor);

        }


        Lecture lecture = new Lecture();

        lecture.setName(request.name());
        lecture.setCode(request.code());
        lecture.setSemesterYear(request.semesterYear());
        lecture.setSemesterSeason(request.semesterSeason());
        lecture.setActive(true);


        //Link Profs to Lecture and vice versa
        lecture.setProfessors(professors);

        for(Professor professor: professors){
            professor.getLectures().add(lecture);
            professorRepository.save(professor);
        }

        lectureRepository.save(lecture);

        return new BasicResponse("Successfully added Lectures", true);
    }


    private LecturesResponse getLectures(boolean includeInactive){

        Set<Lecture> lectures;

        if(includeInactive){
            lectures = lectureRepository.findAllByOrderByNameAsc();
        } else {
            lectures = lectureRepository.findByActiveTrueOrderByNameAsc();
        }

        List<LectureResponse> responses = new ArrayList<>();

        for (Lecture lecture : lectures) {
            responses.add(createLectureResponse(lecture));
        }

        return new LecturesResponse("Found " + responses.size() + " lectures", true, responses);
    }


    /**
     * Creates a LectureResponse for a given Lecture.
     * @param lecture to be parsed
     * @return a LectureResponse
     */
    public static LectureResponse createLectureResponse(Lecture lecture) {

        List<ProfessorShortResponse> professorResponses = new ArrayList<>();

        for (Professor professor : lecture.getProfessors()) {
            professorResponses.add(ProfessorService.createProfessorShortResponse(professor));
        }

        return new LectureResponse(
                lecture.getId(),
                lecture.getName(),
                lecture.getCode(),
                lecture.getSemesterYear(),
                lecture.getSemesterSeason(),
                lecture.isActive(),
                lecture.getLectureType(),
                professorResponses,
                lecture.getComments().size(),
                lecture.getRatings().size()
        );

    }

    public Lecture getById(UUID id) {
        return lectureRepository.findById(id).orElse(null);
    }

    public Lecture getLectureByID(String lectureID) {
        return lectureRepository.findById(UUID.fromString(lectureID)).orElse(null);
    }





}
