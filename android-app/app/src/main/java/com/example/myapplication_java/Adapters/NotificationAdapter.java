package com.example.myapplication_java.Adapters;

import android.graphics.Typeface;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Notification;
import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.ItemNotificationBinding;

import java.text.DateFormat;
import java.util.List;

/**
 * Binds comment-reply notifications and forwards item clicks to the hosting fragment.
 */
public class NotificationAdapter
        extends RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder> {

    private final List<Notification> notifications;
    private final OnNotificationClickListener listener;
    private final DateFormat dateFormat = DateFormat.getDateTimeInstance(
            DateFormat.SHORT,
            DateFormat.SHORT
    );

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

    public static class NotificationViewHolder extends RecyclerView.ViewHolder {

        private final ItemNotificationBinding binding;

        public NotificationViewHolder(ItemNotificationBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        private void bind(
                Notification notification,
                DateFormat dateFormat,
                OnNotificationClickListener listener
        ) {
            binding.notificationTitle.setText(
                    binding.getRoot().getContext().getString(
                            R.string.notification_reply_title,
                            notification.actorUsername
                    )
            );
            binding.notificationOffering.setText(notification.lectureOfferingLabel);
            binding.notificationPreview.setText(notification.replyPreview);
            binding.notificationDate.setText(
                    notification.createdAt == null ? "" : dateFormat.format(notification.createdAt)
            );
            binding.unreadIndicator.setVisibility(
                    notification.isRead ? android.view.View.INVISIBLE : android.view.View.VISIBLE
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

    public interface OnNotificationClickListener {
        void onNotificationClick(Notification notification);
    }
}
