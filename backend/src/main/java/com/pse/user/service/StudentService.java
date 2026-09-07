package com.pse.user.service;


import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.model.Lecture;
import com.pse.lecture.service.LectureService;
import com.pse.rating.service.RatingService;
import com.pse.shared.util.ProfilePictureGenerator;
import com.pse.shared.enums.VoteType;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingDto;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.rating.model.Rating;
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



    @Transactional(readOnly = true)
    public StudentProfileResponse getUserInformation(UUID studentId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return new StudentProfileResponse("Error, cannot authenticate user", false, null, null, 0, 0, 0, 0);
        }

        //CredibilityScore = |Upvotes| - |DownVotes|
        int credibilityScore = calculateCredibilityScore(student);

        student.setCredibilityScore(credibilityScore);

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



    @Transactional(readOnly = true)
    public UserRatingResponse getUserRatings(UUID studentId) {

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            return new UserRatingResponse("Error, cannot authenticate user", false, new ArrayList<>());
        }

        List<UserRatingDto> ratingDtos = new ArrayList<>();

        for (Rating rating : student.getRatings()) {

            Lecture lecture = rating.getLecture();

            LectureResponse lectureResponse = LectureService.createLectureResponse(lecture);

            double overallRating = RatingService.calculateAverageScore(rating);

            UserRatingDto userRatingDto = new UserRatingDto(
                    lectureResponse,
                    overallRating
            );

            ratingDtos.add(userRatingDto);

        }

        return new UserRatingResponse(
                "Success, found " + ratingDtos.size() + " ratings.",
                true,
                ratingDtos
        );
    }


    public BasicResponse deleteAccount(Student student) {

        if (student == null) {
            return new BasicResponse("Error, couldn't authenticate user", false);
        }

        //Soft delete in Database: Set "deleted" to true
        if( !softDeleteByKitEmail(student.getKitEmail())){
            return new BasicResponse("Error, couldn't find student", false);
        }

        return new BasicResponse("Deleted Account successfully: " + student.getKitEmail(), true);
    }


    /**
     * CredibilityScore = |Upvotes| - |DownVotes|
     * @param student
     * @return
     */
    private static int calculateCredibilityScore(Student student) {
        int credibilityScore = 0;

        // Comments
        for (Comment comment : student.getComments()) {
            for (CommentVote vote : comment.getVotes()) {
                if (vote.getVote() == VoteType.UP) {
                    credibilityScore++;
                } else if (vote.getVote() == VoteType.DOWN) {
                    credibilityScore--;
                }
            }
        }

        // Answers
        for (Answer answer : student.getAnswers()) {
            for (AnswerVote vote : answer.getVotes()) {
                if (vote.getVote() == VoteType.UP) {
                    credibilityScore++;
                } else if (vote.getVote() == VoteType.DOWN) {
                    credibilityScore--;
                }
            }
        }
        return credibilityScore;
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


    public double getAverageRating(Student student) {
        if (student.getRatings().isEmpty()) {
        return 0;
        }

        double sum = 0;

        for (Rating rating : student.getRatings()) {
            sum += RatingService.calculateAverageScore(rating);
        }

        return sum / student.getRatings().size();
    }

}
