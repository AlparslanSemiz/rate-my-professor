package com.pse.user.service;


import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pse.shared.util.ProfilePictureGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingDto;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.rating.model.Rating;
import com.pse.rating.model.RatingTopic;
import com.pse.shared.enums.UserStatus;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;


/**
 * Provides user-related business logic.
 * Handles profile information, account actions, and status changes for students.
 */
@Service
public class StudentService {


    private final StudentRepository studentRepository;


    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }


    //Methods used by AccountController

    // Takes the id rather than the Student handed back by AuthService, and
    // re-fetches it here. That earlier Student was loaded in
    // TokenAuthenticationService's own (by now committed and closed)
    // transaction, so its lazy collections are bound to a session that no
    // longer exists; wrapping this method in @Transactional does not reattach
    // it. Re-fetching inside this transaction is what actually makes
    // student.getRatings()/getComments() below initializable.
    @Transactional(readOnly = true)
    public StudentProfileResponse getUserInformation(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return new StudentProfileResponse("Error, cannot authenticate user", false, null, null, 0, 0, 0, 0);
        }
        return new StudentProfileResponse(
                "Success",
                true,
                student.getUsername(),
                ProfilePictureGenerator.generateProfilePicture(student),
                getAverageRating(student),
                student.getRatings().size(),
                student.getComments().size(),
                student.getCredibilityScore()
        );
    }

    // Same reattachment reason as getUserInformation above.
    @Transactional(readOnly = true)
    public UserRatingResponse getUserRatings(UUID studentId) {

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return new UserRatingResponse("Error, cannot authenticate user", false, new ArrayList<>());
        }

        List<UserRatingDto> ratingDtos = new ArrayList<>();

        for (Rating rating : student.getRatings()) {

            String lectureName = rating.getLecture().getName();

            String semester = rating.getLecture().getSemesterSeason()
                    + " "
                    + rating.getLecture().getSemesterYear();

            double weightedSum = 0;
            double totalWeight = 0;

            for (RatingTopic topic : rating.getTopics()) {

                double weight = topic.getCategory().getDefaultWeight();

                weightedSum += topic.getValue() * weight;
                totalWeight += weight;
            }

            double overallRating = totalWeight == 0? 0: weightedSum / totalWeight;

            overallRating = Math.round(overallRating * 100.0) / 100.0;

            ratingDtos.add(
                    new UserRatingDto(
                            lectureName,
                            semester,
                            overallRating
                    )
            );
        }

        return new UserRatingResponse(
                "Success, found " + ratingDtos.size() + " ratings.",
                true,
                ratingDtos
        );
    }



    public BasicResponse requestLogout(Student student) {

        return new BasicResponse("Logged out successfully ("  + " sessions)", true);
    }

    public BasicResponse deleteAccount(Student student) {

        if (student == null) {
            return new BasicResponse("Error, couldnt authenticate user", false);
        }

        //Set deleted in Database: Set "deleted" to true
        if( !softDeleteByKitEmail(student.getKitEmail())){
            return new BasicResponse("Error, couldnt find student", false);
        }

        return new BasicResponse("Deleted Account succesfully: " + student.getKitEmail(), true);
    }




    //Methods used by (other) Services

    public boolean softDeleteByKitEmail(String email){
        Student student = studentRepository.findByKitEmail(email).orElse(null);

        if(student == null) {
            return false;
        }
        student.setStatus(UserStatus.DELETED);
        studentRepository.save(student);
        return true;
    }

    public boolean deleteUser(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);

        if(student == null) {
            return false;
        }

        student.setStatus(UserStatus.DELETED);
        studentRepository.save(student);
        return true;
    }

    public boolean blockStudent(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);

        if(student == null) {
            return false;
        }
        student.setStatus(UserStatus.BLOCKED);
        studentRepository.save(student);
        return true;
    }

    public boolean unblockStudent(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);

        if(student == null) {
            return false;
        }
        student.setStatus(UserStatus.ACTIVE);
        studentRepository.save(student);
        return true;
    }






    private double calculateOverallRating(Rating rating) {

        double weightedSum = 0;
        double totalWeight = 0;

        for (RatingTopic topic : rating.getTopics()) {

            double weight = topic.getCategory().getDefaultWeight();

            weightedSum += topic.getValue() * weight;
            totalWeight += weight;
        }

        if (totalWeight == 0) {
            return 0;
        }

        return weightedSum / totalWeight;
    }


    //Repository Methods


    public Student findByKitEmail(String kitEmail){
        return studentRepository.findByKitEmail(kitEmail).orElse(null);
    }

    public void addStudent(Student student) {
        studentRepository.save(student);
    }

    public double getAverageRating(Student student) {
        if (student.getRatings().isEmpty()) {
        return 0;
        }

        double sum = 0;

        for (Rating rating : student.getRatings()) {
            sum += calculateOverallRating(rating);
        }

        return sum / student.getRatings().size();
    }

    public List<Student> getAllUsers() {
        return studentRepository.findAll();

    }

    public Student getUser(UUID studentId) {
        return studentRepository.findById(studentId).orElse(null);
    }


}
