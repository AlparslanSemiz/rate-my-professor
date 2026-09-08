package com.pse.lecture.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.pse.professor.service.ProfessorService;
import com.pse.rating.model.Rating;
import com.pse.rating.model.RatingCategory;
import com.pse.rating.model.RatingTopic;
import com.pse.rating.service.RatingService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.audit.model.AuditAction;
import com.pse.audit.model.AuditTargetType;
import com.pse.audit.service.AuditWriter;
import com.pse.shared.dto.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.lecture.dto.request.AddLectureRequest;
import com.pse.lecture.dto.response.LectureDetailResponse;
import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.dto.response.LecturesResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.repository.LectureRepository;
import com.pse.shared.error.ApiException;
import com.pse.professor.model.Professor;
import com.pse.professor.repository.ProfessorRepository;
import com.pse.professor.dto.response.ProfessorShortResponse;
import com.pse.security.AuthenticatedUser;


/**
 * Service for Lectures.
 *
 */
@Service
public class LectureService {


    private final LectureRepository lectureRepository;
    private final ProfessorRepository professorRepository;
    private final AuditWriter auditWriter;

    public LectureService(LectureRepository lectureRepository, ProfessorRepository professorRepository, AuditWriter auditWriter ) {
        this.lectureRepository = lectureRepository;
        this.professorRepository = professorRepository;
        this.auditWriter = auditWriter;
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

    /**
     * Creating a lecture is an administrative mutation and is recorded like every other one.
     *
     * <p>It was not, for a long time: updating or deleting the same row wrote an entry and
     * creating it wrote nothing, so the audit log could show a lecture being renamed with no
     * record of where it came from. The entry is keyed {@code exists} in the same shape
     * {@code LECTURE_DELETED} uses, which is what makes it a lifecycle event rather than a field
     * diff -- {@code AuditRevertService} refuses to revert it, correctly: the inverse of a
     * creation is a deletion, which is its own action with its own guards.
     *
     * <p>Takes the principal rather than the student because {@code AuditWriter.write} records
     * the acting {@code Admin}, and a {@code Student} alone cannot say which admin acted.
     *
     * <p>There is deliberately no role check here. {@code SecurityConfig} matches
     * {@code POST /data/lectures} with {@code hasRole("ADMIN")}, and {@code /admin/**} ahead of
     * everything else, so the chain has already decided by the time this runs. The check that
     * used to stand here was unreachable, and answered {@code 200 {"success": false}} where the
     * chain answers {@code 403} -- a second, weaker answer to a question already settled.
     */
    @Transactional
    public BasicResponse addLecture(AuthenticatedUser principal, AddLectureRequest request) {

        if (lectureRepository.findByName(request.name()).isPresent()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Lecture already exists: " + request.name());
        }


        List<UUID> professorsIDs = request.professorIds();
        Set<Professor> professors = new HashSet<>();

        //Validate professorIDs exist
        for (UUID professorID: professorsIDs){

            Professor professor = professorRepository.findById(professorID).orElse(null);

            if (professor == null) {
                throw new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Professor not found: " + professorID);
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

        Map<String, Object> changes = new LinkedHashMap<>();
        changes.put("exists", Map.of("before", false, "after", true));
        auditWriter.write(
                principal.admin(),
                AuditAction.LECTURE_CREATED,
                AuditTargetType.LECTURE,
                lecture.getId(),
                lecture.getName(),
                changes,
                Map.of("professors", professors.size())
        );

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
     * Orders the teaching staff of a lecture: last name, then first name, then id.
     *
     * <p>The same order {@code ProfessorRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc}
     * already uses for the professor listings, so the two surfaces agree. The id is the
     * tie-breaker and is only there to make the sort total -- two people can share a name.
     *
     * <p><b>It is alphabetical, not by role.</b> {@code lecture_professors} records that a
     * person teaches a lecture and nothing else, so the schema cannot say who lectures and
     * who runs an exercise group; that would need a column on the join table. Alphabetical
     * is what the data supports, and it is stable, which is the defect being fixed.
     */
    private static final Comparator<Professor> BY_NAME =
            Comparator.comparing(Professor::getLastName)
                    .thenComparing(Professor::getFirstName)
                    .thenComparing(Professor::getId);

    /**
     * Creates a LectureResponse for a given Lecture.
     * @param lecture to be parsed
     * @return a LectureResponse
     */
    public static LectureResponse createLectureResponse(Lecture lecture) {

        // Sorted, not iterated as it comes. lecture.getProfessors() is a Set and Professor
        // overrides neither equals nor hashCode, so the iteration order is identity-hash
        // order and can differ on every run -- the read side of BUG-3. An unordered list is
        // invisible in a JSON payload and obvious in a title built from it.
        List<ProfessorShortResponse> professorResponses = lecture.getProfessors().stream()
                .sorted(BY_NAME)
                .map(ProfessorService::createProfessorShortResponse)
                .toList();

        double sum = 0;
        int count = 0;

        for (Rating rating : lecture.getRatings()) {
            for (RatingTopic topic : rating.getTopics()) {
                if (topic.getCategory() == RatingCategory.OVERALL) {
                    sum += topic.getValue();
                    count++;
                    break;
                }
            }
        }

        double averageRating = count == 0 ? 0.0 : sum / count;



        String semesterLabel =
                lecture.getSemesterSeason().label(lecture.getSemesterYear());

        return new LectureResponse(
                lecture.getId(),
                lecture.getName(),
                lecture.getCode(),
                lecture.getSemesterYear(),
                lecture.getSemesterSeason(),
                semesterLabel,
                title(semesterLabel, lecture.getName(), professorResponses),
                lecture.isActive(),
                lecture.getLectureType(),
                professorResponses,
                lecture.getComments().size(),
                lecture.getRatings().size(),
                averageRating
        );

    }

    /**
     * {@code "SS26 Algorithmen 1 -- Peter Sanders, Uebungsleiter 1"}, with an em dash.
     *
     * <p>Built here so that every client shows one string rather than three near-identical
     * ones. A lecture nobody is assigned to is just {@code "SS26 Algorithmen 1"}: the
     * separator belongs to the names, and a title ending in a dash reads as a bug.
     */
    private static String title(String semesterLabel,
                                String name,
                                List<ProfessorShortResponse> professors) {

        String heading = semesterLabel + " " + name;

        if (professors.isEmpty()) {
            return heading;
        }

        return heading + " \u2014 " + professors.stream()
                .map(professor -> professor.firstName() + " " + professor.lastName())
                .collect(Collectors.joining(", "));
    }

    public Lecture getById(UUID id) {
        return lectureRepository.findById(id).orElse(null);
    }

    public Lecture getLectureByID(String lectureID) {
        return lectureRepository.findById(UUID.fromString(lectureID)).orElse(null);
    }





}
