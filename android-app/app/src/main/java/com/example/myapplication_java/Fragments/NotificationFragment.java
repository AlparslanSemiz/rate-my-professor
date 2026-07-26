package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.myapplication_java.Adapters.NotificationAdapter;
import com.example.myapplication_java.DomainModel.Notification;
import com.example.myapplication_java.databinding.FragmentNotificationBinding;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * Displays replies to comments of the current user.
 *
 * The local data returned by {@link #createTemporaryNotifications()} is a temporary stand-in
 * until the notification endpoint is available.
 */
public class NotificationFragment extends Fragment {

    private FragmentNotificationBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentNotificationBinding.inflate(inflater, container, false);
        setUpNotificationList();
        binding.backButton.setOnClickListener(v ->
                requireActivity().getSupportFragmentManager().popBackStack()
        );
        return binding.getRoot();
    }

    private void setUpNotificationList() {
        List<Notification> notifications = createTemporaryNotifications();

        binding.notificationList.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.notificationList.setAdapter(
                new NotificationAdapter(notifications, this::onNotificationClicked)
        );

        boolean isEmpty = notifications.isEmpty();
        binding.notificationList.setVisibility(isEmpty ? View.GONE : View.VISIBLE);
        binding.emptyNotifications.setVisibility(isEmpty ? View.VISIBLE : View.GONE);
    }

    /**
     * Keeps the click contract in place for the future CommentThreadFragment navigation.
     */
    private void onNotificationClicked(Notification notification) {
        notification.markAsRead();
        if (binding.notificationList.getAdapter() != null) {
            binding.notificationList.getAdapter().notifyDataSetChanged();
        }
        // TODO: Open CommentThreadFragment with offering, parent comment and reply IDs.
    }

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
