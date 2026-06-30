package com.pse.moderation.repository;



import java.util.UUID;

import com.pse.moderation.model.BugReport;

import org.springframework.data.jpa.repository.JpaRepository;


public interface BugReportRepository extends JpaRepository<BugReport, UUID> {


}