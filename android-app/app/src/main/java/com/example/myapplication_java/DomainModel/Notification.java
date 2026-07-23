package com.example.myapplication_java.DomainModel;

import java.util.Date;

public class Notification {
    public String notificationId;
    public String message;
    public Date createdAt;
    public boolean isRead;
    public String actorUsername;
    public String replyPreview;
    public String lectureOfferingLabel;
    public String lectureOfferingId;
    public String parentCommentId;
    public String replyCommentId;

    public Notification(String notificationId, String message, Date createdAt, boolean isRead) {
        this(notificationId, message, createdAt, isRead, "", "", "", "", "", "");
    }

    public Notification(
            String notificationId,
            String message,
            Date createdAt,
            boolean isRead,
            String actorUsername,
            String replyPreview,
            String lectureOfferingLabel,
            String lectureOfferingId,
            String parentCommentId,
            String replyCommentId
    ) {
        this.notificationId = notificationId;
        this.message = message;
        this.createdAt = createdAt;
        this.isRead = isRead;
        this.actorUsername = actorUsername;
        this.replyPreview = replyPreview;
        this.lectureOfferingLabel = lectureOfferingLabel;
        this.lectureOfferingId = lectureOfferingId;
        this.parentCommentId = parentCommentId;
        this.replyCommentId = replyCommentId;
    }

    public void markAsRead() {
        isRead = true;
    }
}
