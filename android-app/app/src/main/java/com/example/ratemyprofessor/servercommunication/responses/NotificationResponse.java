package com.example.ratemyprofessor.servercommunication.responses;

import com.google.gson.annotations.SerializedName;

import java.time.LocalDateTime;

/**
 * Contains a notification and the comment or lecture information associated with it.
 *
 * @param notificationId the unique notification identifier
 * @param type the notification type
 * @param lectureResponse the lecture associated with the notification
 * @param ownCommentId the identifier of the user comment referenced by the notification
 * @param userName the username associated with the notification
 * @param content the text content
 * @param message the message returned by the server
 * @param createdAt the time the entry was created
 */
public record NotificationResponse(
        @SerializedName("notificationID")
        String notificationId,

        NotificationType type,
        LectureResponse lectureResponse,

        @SerializedName("ownCommentID")
        String ownCommentId,

        String userName,
        String content,
        String message,
        LocalDateTime createdAt
) {}