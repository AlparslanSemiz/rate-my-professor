package com.example.ratemyprofessor.servercommunication.requests;

import com.example.ratemyprofessor.domain.BugSeverity;

public record BugReportRequest(
        String title,

        String description,

        BugSeverity severity
) {
}
