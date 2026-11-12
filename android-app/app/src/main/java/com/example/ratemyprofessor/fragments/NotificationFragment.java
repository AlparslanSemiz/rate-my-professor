package com.example.ratemyprofessor.fragments;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.ratemyprofessor.adapters.NotificationAdapter;
import com.example.ratemyprofessor.domain.Notification;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationType;
import com.example.ratemyprofessor.servercommunication.responses.NotificationsResponse;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.FragmentNotificationBinding;

import com.example.ratemyprofessor.activities.MainActivity;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;

import java.time.ZoneId;
import java.util.ArrayList;

import java.util.Date;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Displays replies to comments of the current user.
 *
 */
public class NotificationFragment extends Fragment {

    private static final String TAG = "NotificationFragment";

    private FragmentNotificationBinding binding;
    private APIService apiService;
    private Call<NotificationsResponse> notificationsCall;
    private Call<CommentsResponse> commentThreadCall;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentNotificationBinding.inflate(inflater, container, false);

        apiService = RetrofitClient.getClient().create(APIService.class);

        binding.notificationList.setLayoutManager(new LinearLayoutManager(requireContext()));

        loadNotifications();

        binding.backButton.setOnClickListener(v ->
                requireActivity().getSupportFragmentManager().popBackStack()
        );
        return binding.getRoot();
    }

    private void loadNotifications() {
        LoginSession session = LoginSession.from(requireContext());

        notificationsCall = apiService.getNotifications(
                session.bearerToken()
        );

        notificationsCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(
                    @NonNull Call<NotificationsResponse> call,
                    @NonNull Response<NotificationsResponse> response
            ) {
                if (binding == null) {
                    return;
                }

                NotificationsResponse body = response.body();

                if (!response.isSuccessful()
                        || body == null
                        || !body.success()) {

                    String errorMessage = body != null
                            ? body.message()
                            : "Benachrichtigungen konnten nicht geladen werden";

                    showLoadError(errorMessage);
                    return;
                }

                List<Notification> notifications = new ArrayList<>();

                if (body.notifications() != null) {
                    for (NotificationResponse serverNotification
                            : body.notifications()) {

                        notifications.add(
                                convertNotification(serverNotification)
                        );
                    }
                }

                showNotifications(notifications);

            }

            @Override
            public void onFailure(
                    @NonNull Call<NotificationsResponse> call,
                    @NonNull Throwable throwable
            ) {
                if (call.isCanceled() || binding == null) {
                    return;
                }

                Log.e(TAG, "Loading notifications failed", throwable);
                showLoadError("Keine Verbindung zum Server");
            }
        });
    }

    private void showNotifications(
            List<Notification> notifications
    ) {
        binding.notificationList.setAdapter(
                new NotificationAdapter(
                        notifications,
                        this::onNotificationClicked
                )
        );

        boolean isEmpty = notifications.isEmpty();

        binding.notificationList.setVisibility(
                isEmpty ? View.GONE : View.VISIBLE
        );

        binding.emptyNotifications.setVisibility(
                isEmpty ? View.VISIBLE : View.GONE
        );
    }

    private void showLoadError(String message) {
        showNotifications(new ArrayList<>());

        Toast.makeText(
                requireContext(),
                message,
                Toast.LENGTH_SHORT
        ).show();
    }

    /**
     * Converts NotificationResponse to Notification for the NotificationAdapter
     * @param response
     * @return
     */
    private Notification convertNotification(
            NotificationResponse response
    ) {
        boolean isWarning =
                response.type() == NotificationType.WARNING;

        String preview = isWarning
                ? valueOrEmpty(response.message())
                : valueOrEmpty(response.content());

        String actorUsername = isWarning
                ? "Warning"
                : valueOrEmpty(response.userName());

        Date createdAt = response.createdAt() == null
                ? null
                : Date.from(
                response.createdAt()
                        .atZone(ZoneId.systemDefault())
                        .toInstant()
        );

        LectureResponse lecture = response.lectureResponse();

        return new Notification(
                valueOrEmpty(response.notificationId()),
                response.type() == null
                        ? ""
                        : response.type().name(),
                createdAt,
                false,
                actorUsername,
                preview,
                createLectureLabel(lecture),
                lecture == null ? "" : valueOrEmpty(lecture.id()),
                valueOrEmpty(response.ownCommentId()),
                ""
        );
    }

    private String createLectureLabel(LectureResponse lecture) {
        if (lecture == null) {
            return "";
        }

        String semester = lecture.semesterSeason() == null
                ? ""
                : lecture.semesterSeason().name()
                  + " "
                  + lecture.semesterYear();

        return valueOrEmpty(lecture.name())
                + " · "
                + valueOrEmpty(lecture.code())
                + " · "
                + semester;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    /**
     * Keeps the click contract in place for the future CommentThreadFragment navigation.
     *
     * @param notification the notification the user tapped
     */
    @SuppressLint("NotifyDataSetChanged")
    private void onNotificationClicked(Notification notification) {
        markNotificationsAsSeen(notification);

        if (binding.notificationList.getAdapter() != null) {
            // The unread marker of the tapped row has to disappear, and redrawing the whole
            // short list is cheaper than tracking its position.
            binding.notificationList.getAdapter().notifyDataSetChanged();
        }
        if (notification.lectureOfferingId.isEmpty()
                || notification.parentCommentId.isEmpty()) {

            Toast.makeText(
                    requireContext(),
                    "This notification has no comment",
                    Toast.LENGTH_SHORT
            ).show();

            return;
        }

        loadAndOpenCommentThread(
                notification.lectureOfferingId,
                notification.parentCommentId
        );

    }

    private void markNotificationsAsSeen(Notification notification) {
        String token = LoginSession.from(requireContext()).bearerToken();


        apiService.markNotificationsAsSeen(token, notification.notificationId)
                .enqueue(new Callback<>() {
                    @Override
                    public void onResponse(
                            @NonNull Call<BasicResponse> call,
                            @NonNull Response<BasicResponse> response
                    ) {
                        BasicResponse body = response.body();

                        if (!response.isSuccessful()
                                || body == null
                                || !body.success()) {

                            Log.w(TAG, "Notifications could not be marked as seen " + response.code());
                            return;
                        }

                        Log.w(TAG, "Notification was marked as seen " + notification.notificationId);

                        notification.markAsRead();

                        if (binding != null
                                && binding.notificationList.getAdapter()
                                instanceof NotificationAdapter adapter) {

                            adapter.notifyNotificationChanged(
                                    notification.notificationId
                            );
                        }
                    }


                    @Override
                    public void onFailure(
                            @NonNull Call<BasicResponse> call,
                            @NonNull Throwable throwable
                    ) {
                        Log.e(TAG, "Could not mark notifications as seen", throwable);
                    }
                });
    }
    private void loadAndOpenCommentThread(String lectureId, String commentId) {
        LoginSession session = LoginSession.from(requireContext());
        commentThreadCall = apiService.getComments(session.bearerToken(), lectureId);

        commentThreadCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<CommentsResponse> call, @NonNull Response<CommentsResponse> response) {
                if (!isAdded()) {
                    return;
                }
                CommentsResponse body = response.body();

                if (!response.isSuccessful()
                        || body == null
                        || !body.success()
                        || body.comments() == null) {
                    Toast.makeText(requireContext(), "Could not load Comments", Toast.LENGTH_SHORT).show();
                    return;
                }
                Comment selectedComment = findComment(body.comments(), commentId);

                if (selectedComment == null) {
                    Toast.makeText(requireContext(), "Could not find related comment", Toast.LENGTH_SHORT).show();

                    return;
                }
                if (requireActivity() instanceof MainActivity mainActivity) {
                    // Dont have a way to get the userVote yet
                    mainActivity.openReplyFragment(selectedComment);
                }
            }

            @Override
            public void onFailure(
                    @NonNull Call<CommentsResponse> call,
                    @NonNull Throwable throwable
            ) {
                if (call.isCanceled() || !isAdded()) {
                    return;
                }

                Log.e(TAG, "Loading comment thread failed", throwable);

                Toast.makeText(
                        requireContext(),
                        "No connection to server",
                        Toast.LENGTH_SHORT
                ).show();
            }
        });
    }

    @Nullable
    private Comment findComment(
            List<Comment> comments,
            String commentId
    ) {
        for (Comment comment : comments) {
            if (commentId.equals(comment.commentID())) {
                return comment;
            }
        }

        return null;
    }

    @Override
    public void onDestroyView() {
        if (notificationsCall != null) {
            notificationsCall.cancel();
        }

        if (commentThreadCall != null) {
            commentThreadCall.cancel();
        }

        super.onDestroyView();
        binding = null;
    }
}
