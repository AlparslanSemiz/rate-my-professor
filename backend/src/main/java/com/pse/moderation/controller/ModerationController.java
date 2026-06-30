package com.pse.moderation.controller;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.service.TokenService;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.dto.response.WarningResponse;
import com.pse.moderation.model.Warning;
import com.pse.moderation.service.ModerationService;
import com.pse.moderation.dto.response.UserListResponse;

import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class ModerationController {


    @Autowired
    private ModerationService moderationService;
    @Autowired
    private TokenService tokenService;



    private boolean validateAdminToken(String authHeader) {

        Student student = tokenService.verifyUser(authHeader);

        return student != null && moderationService.verifyAdmin(student);

    }

    @GetMapping
    public UserListResponse getStudents(@RequestHeader("Authorization") String authHeader) {

        if(validateAdminToken(authHeader)) {
            return null;
        }

        return moderationService.getAllUsers();
    }


    @GetMapping("/{student_id}")
    public UserResponse getStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        if(validateAdminToken(authHeader)) {
            return null;
        }

        return moderationService.getUser(student_id);

    }

    @DeleteMapping("/{student_id}")
    public BasicResponse deleteStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        if(validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        return moderationService.deleteUser(student_id);


    }

    @PatchMapping("/{student_id}")
    public BasicResponse blockStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        if(validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        return moderationService.blockStudent(student_id);

    }

    @PatchMapping("/{student_id}")
    public BasicResponse unblockStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        if(validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        return moderationService.unblockStudent(student_id);

    }


    @PostMapping("/{student_id}/warnings")
    public BasicResponse warnStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id, WarningRequest warningRequest) {

        if(validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        if (student_id != warningRequest.userID()){
            return new BasicResponse("Student id mismatch", false);
        }

        return moderationService.warnStudent(warningRequest);

    }

    @GetMapping("/{student_id}/warnings")
    public WarningHistoryResponse getWarningsForStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        if(validateAdminToken(authHeader)) {
            return new WarningHistoryResponse("Couldnt authenticate Admin", false, null);
        }

        List<Warning> warnings = moderationService.getWarningsForStudent(student_id);
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
