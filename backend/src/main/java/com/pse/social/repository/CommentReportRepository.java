package com.pse.social.repository;



import com.pse.social.model.CommentReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;


public interface CommentReportRepository extends JpaRepository<CommentReport, UUID> {

}
