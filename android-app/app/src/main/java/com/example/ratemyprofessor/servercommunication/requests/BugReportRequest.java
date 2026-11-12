package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.domain.BugSeverity;

/**
 * Contains the title, description, and severity of a bug report.
 *
 * @param title the title
 * @param description the description of the reported bug
 * @param severity the severity of the reported bug
 */
public record BugReportRequest(
        String title,

        String description,

        BugSeverity severity
) {
}
