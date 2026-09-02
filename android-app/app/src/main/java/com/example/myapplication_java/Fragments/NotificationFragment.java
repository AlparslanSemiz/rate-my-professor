package com.example.myapplication_java.Fragments;

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

import com.example.myapplication_java.Adapters.NotificationAdapter;
import com.example.myapplication_java.DomainModel.Notification;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.LectureResponse;
import com.example.myapplication_java.ServerCommunication.Responses.NotificationResponse;
import com.example.myapplication_java.ServerCommunication.Responses.NotificationType;
import com.example.myapplication_java.ServerCommunication.Responses.NotificationsResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.FragmentNotificationBinding;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Displays replies to comments of the current user.
 *
 * The local data returned by {@link #createTemporaryNotifications()} is a temporary stand-in
 * until the notification endpoint is available.
 */
public class NotificationFragment extends Fragment {

    private static final String TAG = "NotificationFragment";

    private FragmentNotificationBinding binding;
    private APIService apiService;
    private Call<NotificationsResponse> notificationsCall;

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
        //setUpNotificationList();
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

        notificationsCall.enqueue(new Callback<NotificationsResponse>() {
            @Override
            public void onResponse(
                    Call<NotificationsResponse> call,
                    Response<NotificationsResponse> response
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

                if (!notifications.isEmpty()) {
                    //markNotificationsAsSeen();
                }
            }

            @Override
            public void onFailure(
                    Call<NotificationsResponse> call,
                    Throwable throwable
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
        notification.markAsRead();
        if (binding.notificationList.getAdapter() != null) {
            // The unread marker of the tapped row has to disappear, and redrawing the whole
            // short list is cheaper than tracking its position.
            binding.notificationList.getAdapter().notifyDataSetChanged();
        }
        // TODO: Open CommentThreadFragment with offering, parent comment and reply IDs.
    }

    /**
     * Builds the stand-in notifications shown until the backend route exists.
     *
     * @return two example notifications, one unread and one already read
     */
    private List<Notification> createTemporaryNotifications() {
        List<Notification> notifications = new ArrayList<>();
        notifications.add(new Notification(
                "notification-1",
                "replied to your comment",
                hoursAgo(2),
                false,
                "AdventuresRabbit",
                "Fand der war blöd.",
                "Kühnlein · LA1 · WS24/25",
                "offering-4711",
                "comment-9321",
                "comment-9550"
        ));
        notifications.add(new Notification(
                "notification-2",
                "replied to your comment",
                hoursAgo(26),
                true,
                "CourageousRaccoon",
                "Tolles Gitarren Solo amk.",
                "Kühnlein · LA1 · WS24/25",
                "offering-4711",
                "comment-9321",
                "comment-9588"
        ));
        return notifications;
    }

    /**
     * @param hours how far in the past the returned date should lie
     * @return the point in time that many hours before now
     */
    private Date hoursAgo(int hours) {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR, -hours);
        return calendar.getTime();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
