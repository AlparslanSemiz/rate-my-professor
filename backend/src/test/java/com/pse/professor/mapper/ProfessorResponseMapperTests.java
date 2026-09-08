package com.pse.professor.mapper;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import com.pse.lecture.model.Lecture;
import com.pse.professor.dto.response.ProfessorResponse;
import com.pse.professor.model.Professor;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Moved here with the code from {@code ProfessorServiceTests}, where it tested a
 * {@code public static} method on a service.
 */
class ProfessorResponseMapperTests {

    /**
     * {@code lectureIds} comes out of {@code Professor.lectures}, a {@code Set}, so it has the
     * same defect the professor list of a lecture had: no order of its own, and therefore a
     * different one between two requests. Fed a {@code LinkedHashSet} in the wrong order for
     * the same reason as {@code LectureServiceTests} -- a real {@code HashSet} would make the
     * test depend on identity-hash order and be flaky about a defect that is not.
     */
    @Test
    void toResponse_lecturesInAnyOrder_answersTheirIdsByLectureName() {

        Professor professor = new Professor();
        professor.setFirstName("Peter");
        professor.setLastName("Sanders");

        Lecture algorithms = lectureNamed("Algorithmen 1");
        Lecture theory = lectureNamed("Theoretische Grundlagen");
        Lecture programming = lectureNamed("Programmieren");

        professor.setLectures(new LinkedHashSet<>(List.of(theory, programming, algorithms)));


        ProfessorResponse response = ProfessorResponseMapper.toResponse(professor);


        assertThat(response.lectureIds())
                .containsExactly(algorithms.getId(), programming.getId(), theory.getId());
    }

    private static Lecture lectureNamed(String name) {
        Lecture lecture = new Lecture();
        lecture.setId(UUID.randomUUID());
        lecture.setName(name);
        return lecture;
    }
}
