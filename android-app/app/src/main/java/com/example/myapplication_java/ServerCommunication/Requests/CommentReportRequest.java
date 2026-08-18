package com.example.myapplication_java.ServerCommunication.Requests;

import com.example.myapplication_java.ServerCommunication.ReportReason;

public record CommentReportRequest (
        String commentID,
        ReportReason reportReason,
        String explanation
) {}
