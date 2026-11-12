package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.servercommunication.ReportReason;

/**
 * Contains the target comment, report reason, and user explanation.
 *
 * @param commentID the identifier of the comment
 * @param reportReason the reason for reporting the comment
 * @param explanation the explanation supplied with the report
 */
public record CommentReportRequest (
        String commentID,
        ReportReason reportReason,
        String explanation
) {}
