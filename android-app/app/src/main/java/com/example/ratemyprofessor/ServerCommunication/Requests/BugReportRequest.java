package com.example.ratemyprofessor.ServerCommunication.Requests;

import com.example.ratemyprofessor.DomainModel.BugSeverity;

public record BugReportRequest(
        String title,

        String description,

        BugSeverity severity
) {
}
