package com.pse.user.service;


import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingDto;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.auth.service.AuthService;
import com.pse.rating.model.Rating;
import com.pse.rating.model.RatingTopic;
import com.pse.user.dto.StudentProfileResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.pse.shared.enums.UserStatus;
import com.pse.user.model.Student;
import com.pse.user.repository.StudentRepository;


/**
 * Provides user-related business logic.
 * Handles profile information, account actions, and status changes for students.
 */
@Service
public class StudentService {


    @Autowired
    private StudentRepository studentRepository;



    //Methods used by AccountController

    public StudentProfileResponse getUserInformation(Student student) {
        return new StudentProfileResponse(
                "Success",
                true,
                student.getUsername(),
                getAverageRating(student),
                student.getRatings().size(),
                student.getComments().size(),
                student.getCredibilityScore()
        );
    }

    public UserRatingResponse getUserRatings(Student student) {


        List<UserRatingDto> ratingDtos = new ArrayList<>();

        for (Rating rating : student.getRatings()) {

            String lectureName = rating.getLecture().getName();

            String professorName = rating.getLecture().getProfessor().getLastName();

            String semester = rating.getLecture().getSemesterSeason().toString()
                    + rating.getLecture().getSemesterYear();

            int overallRating = 0;

            for (RatingTopic topic : rating.getTopics()) {
                if (topic.getName().equals("overall")) {
                    overallRating = topic.getValue();
                    break;
                }
            }

            ratingDtos.add(new UserRatingDto(
                    lectureName,
                    professorName,
                    semester,
                    overallRating
            ));
        }

        return new UserRatingResponse(
                "Success",
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






    //Repository Methods


    public Student findByKitEmail(String kitEmail){
        return studentRepository.findByKitEmail(kitEmail).orElse(null);
    }

    public void addStudent(Student student) {
        studentRepository.save(student);
    }

    public double getAverageRating(Student student) {
        return studentRepository.getAverageOverallRating(student);
    }

    public List<Student> getAllUsers() {
        return studentRepository.findAll();

    }

    public Student getUser(UUID studentId) {
        return studentRepository.findById(studentId).orElse(null);
    }


}
