package com.pse.moderation.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.AuthService;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.dto.response.WarningResponse;
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
public class ModerationUserService {

    @Autowired
    private StudentService studentService;
    @Autowired
    private AuthService authService;


    @Autowired
    private AdminRepository moderationRepository;
    @Autowired
    private WarningRepository warningRepository;



    public boolean validateAdminToken(String authHeader) {

        Student student = authService.verifyUser(authHeader);

        return student != null && verifyAdmin(student);

    }

    public boolean verifyAdmin(Student student) {

        return moderationRepository.existsById(student.getId());
    }



    public UserListResponse getStudents(String authHeader) {

        if(!validateAdminToken(authHeader)) {
            return null;
        }

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

    public UserResponse getStudent(String authHeader, UUID studentId) {

        if(!validateAdminToken(authHeader)) {
            return null;
        }


        Student student = studentService.getUser(studentId);

        if(student == null) {
            return null;
        }

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

    public BasicResponse deleteStudent(String authHeader, UUID studentId) {

        if(!validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        if(studentService.deleteUser(studentId)){
            return new BasicResponse("Deleted User successfully", true);
        }

        return new BasicResponse("Couldnt delete User ", false);

    }

    public BasicResponse blockStudent(String authHeader, UUID studentId) {
        if(!validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        if(studentService.blockStudent(studentId)){
            return new BasicResponse("Student blocked successfully", true);
        }

        return new BasicResponse("Couldnt block User", false);
    }

    public BasicResponse unblockStudent(String authHeader, UUID studentId) {

        if(!validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        if(studentService.unblockStudent(studentId)){
            return new BasicResponse("Student unblocked successfully", true);
        }

        return new BasicResponse("Couldnt unblock User", false);

    }

    public BasicResponse warnStudent(String authHeader, UUID studentId, WarningRequest warningRequest) {


        if(!validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        if (studentId != warningRequest.userID()){
            return new BasicResponse("Student id mismatch", false);
        }

        Warning warning = new Warning();
        warning.setStudent(studentService.getUser(warningRequest.userID()));
        warning.setMessage(warningRequest.message());
        warning.setAdmin(warningRequest.createdFrom());

        warningRepository.save(warning);

        return new BasicResponse("Student warned successfully", true);
    }

    public WarningHistoryResponse getWarningsForStudent(String authHeader, UUID studentId) {

        if(!validateAdminToken(authHeader)) {
            return new WarningHistoryResponse("Couldnt authenticate Admin", false, null);
        }

        Student student = studentService.getUser(studentId);
        if(student == null){
            return null;
        }
        List<Warning> warnings = warningRepository.findByStudent(student);


        List<WarningResponse> responses = new ArrayList<>();

        for (Warning warning : warnings) {

            responses.add(new WarningResponse(
                    warning.getStudent().getId(),
                    warning.getMessage(),
                    warning.getCreatedAt(),
                    warning.getAdmin()
            ));

        }
        return new WarningHistoryResponse("Successfully found warnings for student", true, responses);
    }

}
