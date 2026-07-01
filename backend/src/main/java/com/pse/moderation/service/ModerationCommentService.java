package com.pse.moderation.service;


import com.pse.auth.dto.response.BasicResponse;
import com.pse.moderation.dto.response.ReportedCommentResponse;
import com.pse.moderation.dto.response.ReportedCommentsResponse;
import com.pse.moderation.dto.response.UserReferenceResponse;
import com.pse.moderation.repository.WarningRepository;
import com.pse.shared.enums.ReportStatus;
import com.pse.shared.enums.UserRole;
import com.pse.social.model.CommentReport;
import com.pse.social.service.SocialService;
import com.pse.user.model.Student;
import com.pse.user.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ModerationCommentService {


    @Autowired
    private StudentService studentService;
    @Autowired
    private SocialService socialService;
    @Autowired
    private ModerationUserService moderationUserService;

    @Autowired
    private WarningRepository warningRepository;



    //TODO: undefined flied: "postContext"
    public ReportedCommentsResponse getReportedComments(String authHeader) {

        if(moderationUserService.validateAdminToken(authHeader)) {
            return null;
        }

        List<CommentReport> reports = socialService.getReportedComments();
        List<ReportedCommentResponse> responses = new ArrayList<>();

        for (CommentReport report : reports) {

            responses.add(new ReportedCommentResponse(
                    report.getId(),
                    report.getComment().getContent(),
                    "Idk what this should be",
                    report.getExplanation(),
                    new UserReferenceResponse(
                            report.getComment().getStudent().getId(),
                            report.getComment().getStudent().getUsername(),
                            UserRole.STUDENT,
                            getWarningsCount(report.getComment().getStudent().getId()),
                            report.getComment().getStudent().getStatus()
                            ),
                    new UserReferenceResponse(
                            report.getReporter().getId(),
                            report.getReporter().getUsername(),
                            UserRole.STUDENT,
                            getWarningsCount(report.getReporter().getId()),
                            report.getReporter().getStatus()
                    ),

                    report.getReason(),
                    report.getStatus(),
                    report.getCreatedAt()
            ));

        }

        return new ReportedCommentsResponse("Successfully found all reported Comments", true, responses);
    }

    public BasicResponse updateReportStatus(String authHeader, UUID reportId, ReportStatus status) {


        if(moderationUserService.validateAdminToken(authHeader)) {
            return new BasicResponse("Couldnt authenticate Admin", false);
        }

        if(socialService.updateReportStatus(reportId, status)){
            return new BasicResponse("Successfully updated Status", true);
        }
        return new BasicResponse("Couldnt updated Status", false);
    }


    private int getWarningsCount(UUID studentId) {
        Student student = studentService.getUser(studentId);
        if(student == null){
            return 0;
        }
        return warningRepository.findByStudent(student).size();
    }


}
