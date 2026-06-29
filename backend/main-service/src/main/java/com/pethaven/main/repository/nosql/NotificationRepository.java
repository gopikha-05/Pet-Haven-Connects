package com.pethaven.main.repository.nosql;

import com.pethaven.main.model.nosql.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientId(String recipientId);
    List<Notification> findByRecipientIdAndIsRead(String recipientId, boolean isRead);
    List<Notification> findByRecipientRole(String recipientRole);
}
