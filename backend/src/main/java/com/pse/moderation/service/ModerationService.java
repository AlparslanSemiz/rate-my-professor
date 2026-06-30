package com.pse.moderation.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.model.Warning;
import com.pse.moderation.repository.AdminRepository;
import com.pse.moderation.repository.WarningRepository;
import com.pse.shared.enums.UserRole;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Service
public class ModerationService {


    @Autowired
    private AdminRepository moderationRepository;
    @Autowired
    private WarningRepository warningRepository;
    @Autowired
    private StudentService studentService;


    public boolean verifyAdmin(Student student) {

        return moderationRepository.existsById(student.getId());
    }

    public UserListResponse getAllUsers() {


        List<Student> students = studentService.getAllUsers();

        List<UserResponse> users = new ArrayList<>();

        for (Student student : students) {

            UserResponse user = new UserResponse(
                    student.getId(),
                    student.getUsername(),
                    student.getKitEmail(),
                    verifyAdmin(student) ? UserRole.ADMIN : UserRole.STUDENT,
                    student.getStatus(),
                    student.getCreatedAt(),
                    student.getLastSeenAt(),
                    student.getBiography(),
                    student.getWarnings().size(),
                    student.getCommentReports().size() + student.getAnswerReports().size()
            );

            users.add(user);

        }


        return new UserListResponse("Success", true, users);

    }


    public UserResponse getUser(UUID studentId) {

        Student student = studentService.getUser(studentId);

        return new UserResponse(
                student.getId(),
                student.getUsername(),
                student.getKitEmail(),
                verifyAdmin(student) ? UserRole.ADMIN : UserRole.STUDENT,
                student.getStatus(),
                student.getCreatedAt(),
                student.getLastSeenAt(),
                student.getBiography(),
                student.getWarnings().size(),
                student.getCommentReports().size() + student.getAnswerReports().size()
        );
    }



    public BasicResponse deleteUser(UUID studentId) {

        if(studentService.deleteUser(studentId)){
            return new BasicResponse("Deleted User successfully", true);
        }

        return new BasicResponse("Couldnt delete User ", false);

    }

    public BasicResponse blockStudent(UUID studentId) {

        if(studentService.blockStudent(studentId)){
            return new BasicResponse("Student blocked successfully", true);
        }

        return new BasicResponse("Couldnt block User", false);
    }

    public BasicResponse unblockStudent(UUID studentId) {

        if(studentService.unblockStudent(studentId)){
            return new BasicResponse("Student unblocked successfully", true);
        }


        return new BasicResponse("Couldnt unblock User", false);

    }

    public BasicResponse warnStudent(WarningRequest warningRequest) {

        Warning warning = new Warning();
        warning.setStudent(studentService.getUser(warningRequest.userID()));
        warning.setMessage(warningRequest.message());
        warning.setAdmin(warningRequest.createdFrom());

        warningRepository.save(warning);

        return new BasicResponse("Student warned successfully", true);
    }

    public List<Warning> getWarningsForStudent(UUID studentId) {

        Student student = studentService.getUser(studentId);
        if(student == null){
            return null;
        }
        return warningRepository.findByStudent(student);

    }



    public int getWarningsCount(UUID studentId) {
        Student student = studentService.getUser(studentId);
        if(student == null){
            return 0;
        }
        return warningRepository.findByStudent(student).size();
    }
}
