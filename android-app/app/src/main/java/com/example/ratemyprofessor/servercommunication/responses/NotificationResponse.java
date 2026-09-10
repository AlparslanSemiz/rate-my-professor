package com.example.ratemyprofessor.servercommunication.responses;

import com.google.gson.annotations.SerializedName;

import java.time.LocalDateTime;

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