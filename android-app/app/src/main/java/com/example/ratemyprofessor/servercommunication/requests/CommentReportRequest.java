package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.servercommunication.ReportReason;

public record CommentReportRequest (
        String commentID,
        ReportReason reportReason,
        String explanation
) {}
