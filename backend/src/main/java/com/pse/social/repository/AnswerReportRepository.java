package com.pse.social.repository;


import com.pse.social.model.AnswerReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;


public interface AnswerReportRepository extends JpaRepository<AnswerReport, UUID> {

}
