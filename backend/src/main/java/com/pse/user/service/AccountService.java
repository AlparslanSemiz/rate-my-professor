package com.pse.user.service;

import com.pse.auth.dto.response.BasicResponse;
import com.pse.auth.dto.response.UserRatingResponse;
import com.pse.auth.service.AuthService;
import com.pse.user.dto.StudentProfileResponse;
import com.pse.user.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AccountService {

    private final AuthService authService;

    private final StudentService studentService;


    public AccountService(AuthService authService, StudentService studentService) {
        this.authService = authService;
        this.studentService = studentService;
    }


    public UserRatingResponse getUserRatings(String authHeader) {

        Student student = authService.verifyUser(authHeader);
        if(student == null) {
            return new UserRatingResponse("Error, couldnt verify User", false,null);
        }

        return studentService.getUserRatings(student.getId());


    }

        public StudentProfileResponse getUserInformation(String authHeader) {

        Student student = authService.verifyUser(authHeader);

        if (student == null) {
            return new StudentProfileResponse(
                    "Error, cannot authenticate user",
                    false,
                    null,
                    0,
                    0,
                    0,
                    0
            );
        }

        return studentService.getUserInformation(student.getId());
    }

    public BasicResponse deleteAccount(String authHeader) {

        Student student = authService.verifyUser(authHeader);

        BasicResponse response = studentService.deleteAccount(student);

        if (response.success()) {
            // Without this the account is DELETED but every issued token stays
            // valid until it expires, which for a student is a full year.
            authService.invalidateAllAuthTokensForEmail(student.getKitEmail());
        }

        return response;
    }

    public BasicResponse requestLogout(String authHeader) {

        Student student = authService.verifyUser(authHeader);

        if (student == null) {
            return new BasicResponse("Error, couldnt authenticate user", false);
        }

        //Iterate through every entry in AuthToken and delete every match where: AuthToken.email == email
        int sessions = authService.invalidateAllAuthTokensForEmail(student.getKitEmail());

        return new BasicResponse("Logged out successfully (" + sessions + " sessions)", true);
    }



}
