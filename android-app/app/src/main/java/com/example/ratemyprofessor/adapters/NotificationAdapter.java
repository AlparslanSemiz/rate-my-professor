package com.example.ratemyprofessor.adapters;

import android.graphics.Typeface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.domain.Notification;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.responses.NotificationType;
import com.example.ratemyprofessor.databinding.ItemNotificationBinding;

import java.text.DateFormat;
import java.util.List;

/**
 * Binds comment-reply notifications and forwards item clicks to the hosting fragment.
 *
 * <p>Unread entries are marked twice, with a dot and with a bold title, so the state is also
 * recognizable without relying on color alone.</p>
 */
public class NotificationAdapter
        extends RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder> {

    private final List<Notification> notifications;
    private final OnNotificationClickListener listener;

    /**
     * Shared by all rows: creating a DateFormat is expensive and it is only read while binding.
     */
    private final DateFormat dateFormat = DateFormat.getDateTimeInstance(
            DateFormat.SHORT,
            DateFormat.SHORT
    );

    /**
     * Creates a NotificationAdapter with the supplied data and interaction listener.
     *
     * @param notifications the notifications to display
     * @param listener the listener notified when the user interacts with an item
     */
    public NotificationAdapter(
            List<Notification> notifications,
            OnNotificationClickListener listener
    ) {
        this.notifications = notifications;
        this.listener = listener;
    }

    @NonNull
    @Override
    public NotificationViewHolder onCreateViewHolder(
            @NonNull ViewGroup parent,
            int viewType
    ) {
        ItemNotificationBinding binding = ItemNotificationBinding.inflate(
                LayoutInflater.from(parent.getContext()),
                parent,
                false
        );
        return new NotificationViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull NotificationViewHolder holder, int position) {
        Notification notification = notifications.get(position);
        holder.bind(notification, dateFormat, listener);
    }

    @Override
    public int getItemCount() {
        return notifications.size();
    }

    /**
     * Holds the views of a single notification row.
     */
    public static class NotificationViewHolder extends RecyclerView.ViewHolder {

        private final ItemNotificationBinding binding;

        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
        public NotificationViewHolder(ItemNotificationBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        /**
         * Fills the row with one notification and wires up its click.
         *
         * @param notification the notification to display
         * @param dateFormat   the format the creation date is shown in
         * @param listener     receives the click on this row
         */
        private void bind(
                Notification notification,
                DateFormat dateFormat,
                OnNotificationClickListener listener
        ) {

            boolean isWaringin = NotificationType.WARNING.name().equals(notification.message);

            if (isWaringin) {
                binding.notificationTitle.setText(R.string.notification_warning_title);
            } else {
                binding.notificationTitle.setText(
                        binding.getRoot().getContext().getString(
                                R.string.notification_reply_title,
                                notification.actorUsername
                        )
                );
            }

            binding.notificationOffering.setText(notification.lectureOfferingLabel);
            binding.notificationPreview.setText(notification.replyPreview);
            binding.notificationDate.setText(
                    notification.createdAt == null ? "" : dateFormat.format(notification.createdAt)
            );

            // INVISIBLE rather than GONE, so read and unread rows keep the same layout.
            binding.unreadIndicator.setVisibility(
                    notification.isRead ? View.INVISIBLE : View.VISIBLE
            );
            binding.notificationTitle.setTypeface(
                    null,
                    notification.isRead ? Typeface.NORMAL : Typeface.BOLD
            );
            binding.getRoot().setOnClickListener(v ->
                    listener.onNotificationClick(notification)
            );
        }
    }

    /**
     * This method is used to mark individual notifications as read
     * @param notificationId
     */
    public void notifyNotificationChanged(String notificationId) {
        for (int position = 0; position < notifications.size(); position++) {
            Notification notification = notifications.get(position);

            if (notificationId.equals(notification.notificationId)) {
                notifyItemChanged(position);
                return;
            }
        }
    }

    /**
     * Reports which notification the user clicked.
     */
    public interface OnNotificationClickListener {

        /**
         * Handles the notification click event.
         *
         * @param notification the clicked notification
         */
        void onNotificationClick(Notification notification);
    }
}
