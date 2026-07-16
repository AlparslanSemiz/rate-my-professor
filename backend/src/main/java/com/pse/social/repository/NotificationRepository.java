package com.pse.social.repository;


import com.pse.social.model.Notification;
import com.pse.user.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID>{

    List<Notification> findAllByRecipientAndSeenFalseOrderByCreatedAtDesc(Student recipient);


    @Modifying
    @Transactional
    @Query("""
    UPDATE Notification n
    SET n.seen = true
    WHERE n.recipient = :recipient
      AND n.seen = false
""")
    int markAllAsSeen(@Param("recipient") Student recipient);
}
