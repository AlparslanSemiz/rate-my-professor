package com.example.ratemyprofessor.domain;

import java.util.Date;

/**
 * A notification telling the user that someone answered one of their comments.
 *
 * <p>The last fields carry everything the notification screen needs to jump straight to the
 * answered comment, so no extra server request is needed when the user taps an entry.</p>
 */
public class Notification {

    /**
     * Unique id of the notification.
     */
    public String notificationId;

    /**
     * What happened, for example "replied to your comment".
     */
    public String message;

    /**
     * When the notification was created.
     */
    public Date createdAt;

    /**
     * Whether the user already opened this notification.
     */
    public boolean isRead;

    /**
     * The anonymized name of the user who wrote the answer.
     */
    public String actorUsername;

    /**
     * The first characters of the answer, shown as a preview in the list.
     */
    public String replyPreview;

    /**
     * The lecture offering as a readable label, for example "Kühnlein · LA1 · WS24/25".
     */
    public String lectureOfferingLabel;

    /**
     * Id of the lecture offering the comment belongs to, used for navigation.
     */
    public String lectureOfferingId;

    /**
     * Id of the user's own comment that was answered, used for navigation.
     */
    public String parentCommentId;

    /**
     * Id of the answer itself, used for navigation.
     */
    private String replyCommentId;

    /**
     * Creates a notification without the navigation details.
     *
     * <p>Delegates to the full constructor and leaves the remaining fields empty, so no code
     * has to deal with null when only the basic data is known.</p>
     *
     * @param notificationId the unique notification identifier
     * @param message the message returned by the server
     * @param createdAt the time the entry was created
     * @param isRead whether the notification has been read
     */
    public Notification(String notificationId, String message, Date createdAt, boolean isRead) {
        this(notificationId, message, createdAt, isRead, "", "", "", "", "", "");
    }

    /**
     * Creates a notification with all details needed to display and open it.
     *
     * @param notificationId the unique notification identifier
     * @param message the message returned by the server
     * @param createdAt the time the entry was created
     * @param isRead whether the notification has been read
     * @param actorUsername the username of the user who triggered the notification
     * @param replyPreview the preview text of the reply
     * @param lectureOfferingLabel the display label of the associated lecture offering
     * @param lectureOfferingId the identifier of the associated lecture offering
     * @param parentCommentId the identifier of the parent comment
     * @param replyCommentId the identifier of the reply
     */
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

    /**
     * Marks this notification as read, which removes its unread marker in the list.
     */
    public void markAsRead() {
        isRead = true;
    }
}
