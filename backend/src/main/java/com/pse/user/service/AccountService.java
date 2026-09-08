package com.pse.user.service;

import com.pse.shared.dto.BasicResponse;
import com.pse.user.dto.UserRatingResponse;
import com.pse.auth.service.AuthService;
import com.pse.shared.util.ProfilePictureGenerator;
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


    public UserRatingResponse getUserRatings(Student student) {
        return studentService.getUserRatings(student.getId());
    }

    public StudentProfileResponse getUserInformation(Student student) {
        return studentService.getUserInformation(student.getId());
    }

    public BasicResponse deleteAccount(Student student) {

        // Since F-5 the failure arrives as a thrown ApiException, so an unsuccessful
        // deletion never reaches the revocation below at all. The condition is kept as the
        // statement of the rule rather than as the only thing enforcing it: without it, an
        // account that was not deleted would still be signed out of every session, and if
        // the failure signalling ever changes back the rule survives the change.
        BasicResponse response = studentService.deleteAccount(student);

        if (response.success()) {
            // Without this the account is DELETED but every issued token stays
            // valid until it expires, which for a student is a full year.
            authService.invalidateAllAuthTokensForEmail(student.getKitEmail());
        }

        return response;
    }

    public BasicResponse requestLogout(Student student) {


        //Iterate through every entry in AuthToken and delete every match where: AuthToken.email == email
        int sessions = authService.invalidateAllAuthTokensForEmail(student.getKitEmail());

        return new BasicResponse("Logged out successfully (" + sessions + " sessions)", true);
    }



}
