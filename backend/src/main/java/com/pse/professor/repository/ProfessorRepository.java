package com.pse.professor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.pse.professor.model.Professor;

public interface ProfessorRepository extends JpaRepository<Professor, UUID> {

    /**
     * The reads below fetch {@code lectures} with the professor because the response carries
     * {@code lectureIds}. {@code Professor.lectures} is the inverse side of the many-to-many
     * and is lazy, and open-in-view is disabled, so without the graph these reads are an N+1
     * at best and a LazyInitializationException at worst.
     */
    @EntityGraph(attributePaths = "lectures")
    List<Professor> findByActiveTrueOrderByLastNameAscFirstNameAsc();

    @EntityGraph(attributePaths = "lectures")
    List<Professor> findAllByOrderByLastNameAscFirstNameAsc();

    @EntityGraph(attributePaths = "lectures")
    Optional<Professor> findWithLecturesById(UUID id);

    Optional<Professor> findByFirstNameAndLastName(String firstName, String lastName);
}
