package com.example.myapplication_java.DomainModel;

import java.util.Date;

public class Notification {
    public String notificationId;
    public String message;
    public Date createdAt;
    public boolean isRead;

    public Notification(String notificationId, String message, Date createdAt, boolean isRead) {
        this.notificationId = notificationId;
        this.message = message;
        this.createdAt = createdAt;
        this.isRead = isRead;
    }

    //TODO: Implement the method.
    public void markAsRead() {}
}
