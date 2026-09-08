package com.pse.user.service;


import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pse.lecture.mapper.LectureResponseMapper;
import com.pse.rating.service.RatingAverages;
import com.pse.lecture.dto.response.LectureResponse;
import com.pse.lecture.model.Lecture;
import com.pse.shared.util.ProfilePictureGenerator;
import com.pse.shared.enums.VoteType;
import com.pse.social.model.Answer;
import com.pse.social.model.AnswerVote;
import com.pse.social.model.Comment;
import com.pse.social.model.CommentVote;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pse.shared.dto.BasicResponse;
import com.pse.user.dto.UserRatingDto;
import com.pse.user.dto.UserRatingResponse;
import com.pse.rating.model.Rating;
import com.pse.shared.enums.UserStatus;
import com.pse.shared.error.ApiException;
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
            throw new ApiException(HttpStatus.NOT_FOUND, "Student not found");
        }

        //CredibilityScore = |Upvotes| - |DownVotes|
        int credibilityScore = calculateCredibilityScore(student);

        // Deliberately not written back to the entity -- F-9. This method is
        // @Transactional(readOnly = true) and the score is derived, so the assignment was a
        // mutation of a managed entity inside a transaction meant for reading, whose effect
        // depended on what dirty checking chose to do. It also aimed at a column somebody
        // else owns: an administrator can set credibilityScore through ModerationUserService
        // and UserRevertHandler can revert it, so a student opening their own profile could
        // silently overwrite that adjustment. The response below carries the computed value
        // either way, so nothing a caller sees changes.

        return new StudentProfileResponse(
                "Success",
                true,
                student.getUsername(),
                ProfilePictureGenerator.generateProfilePicture(student),
                RatingAverages.scoreAcross(student.getRatings()),
                student.getRatings().size(),
                student.getComments().size(),
                credibilityScore
        );
    }



    @Transactional(readOnly = true)
    public UserRatingResponse getUserRatings(UUID studentId) {

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student not found");
        }

        List<UserRatingDto> ratingDtos = new ArrayList<>();

        for (Rating rating : student.getRatings()) {

            Lecture lecture = rating.getLecture();

            LectureResponse lectureResponse = LectureResponseMapper.toResponse(lecture);

            double overallRating = RatingAverages.weightedScore(rating);

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
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not logged in");
        }

        //Soft delete in Database: Set "deleted" to true
        if( !softDeleteByKitEmail(student.getKitEmail())){
            throw new ApiException(HttpStatus.NOT_FOUND, "Student not found");
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


}
