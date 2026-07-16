package com.pse.moderation.controller;



import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.request.WarningRequest;
import com.pse.moderation.dto.response.UserListResponse;
import com.pse.moderation.dto.response.UserResponse;
import com.pse.moderation.dto.response.WarningHistoryResponse;
import com.pse.moderation.service.ModerationUserService;

@RestController
@RequestMapping("/users")
public class ModerationUserController {


    private final ModerationUserService moderationUserService;



    public ModerationUserController(ModerationUserService moderationUserService) {
        this.moderationUserService = moderationUserService;
    }


    @GetMapping
    public UserListResponse getStudents(@RequestHeader("Authorization") String authHeader) {

        return moderationUserService.getStudents(authHeader);

    }


    @GetMapping("/{student_id}")
    public UserResponse getStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        return moderationUserService.getStudent(authHeader, student_id);

    }

    @DeleteMapping("/{student_id}")
    public BasicResponse deleteStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        return moderationUserService.deleteStudent(authHeader, student_id);

    }

    @PatchMapping("/{student_id}/block")
    public BasicResponse blockStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        return moderationUserService.blockStudent(authHeader, student_id);

    }

    @PatchMapping("/{student_id}/unblock")
    public BasicResponse unblockStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        return moderationUserService.unblockStudent(authHeader, student_id);

    }


    @PostMapping("/{student_id}/warnings")
    public BasicResponse warnStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id, @RequestBody WarningRequest warningRequest) {

        return moderationUserService.warnStudent(authHeader, student_id, warningRequest);

    }

    @GetMapping("/{student_id}/warnings")
    public WarningHistoryResponse getWarningsForStudent(@RequestHeader("Authorization") String authHeader, @PathVariable UUID student_id) {

        return moderationUserService.getWarningsForStudent(authHeader, student_id);

    }


}
