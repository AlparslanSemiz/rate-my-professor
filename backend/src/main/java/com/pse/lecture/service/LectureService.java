package com.pse.lecture.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
    private final AuthService authService;

    private final LectureRepository lectureRepository;
    private final ProfessorRepository professorRepository;

    public LectureService(ModerationUserService moderationUserService, AuthService authService, LectureRepository lectureRepository, ProfessorRepository professorRepository ) {
        this.moderationUserService = moderationUserService;
        this.authService = authService;
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


    public BasicResponse addLecture(String authHeader, AddLectureRequest request) {

        Student student = authService.verifyUser(authHeader);
        if(!(student != null && moderationUserService.verifyAdmin(student))){
            return new BasicResponse("User is not authorized to add Lectures (isnt Admin)", false);
        }

        if (lectureRepository.findByName(request.name()).isPresent()) {
            return new BasicResponse("Lecture already exists: " + request.name(),false);
        }


        List<UUID> professorsIDs = request.professorIds();
        List<Professor> professors = new ArrayList<>();

        //Validate professorIDs exist
        for (UUID professorID: professorsIDs){

            if(professorRepository.existsById(professorID)){
                professors.add(professorRepository.findById(professorID).orElse(null));
            }else{
                return new BasicResponse("Professor not found: " + professorID, false);
            }

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

        List<Lecture> lectures;

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
            professorResponses.add(
                    new ProfessorShortResponse(
                            professor.getId(),
                            professor.getFirstName(),
                            professor.getLastName(),
                            professor.isActive()
                    )
            );
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
