package com.example.ratemyprofessor.ServerCommunication.Requests;

import com.example.ratemyprofessor.ServerCommunication.ReportReason;

public record CommentReportRequest (
        String commentID,
        ReportReason reportReason,
        String explanation
) {}
