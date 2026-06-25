package com.pse.social.repository;



import com.pse.social.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;


public interface AnswerRepository extends JpaRepository<Answer, UUID> {

}

