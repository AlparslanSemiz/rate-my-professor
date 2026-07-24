package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.ContentStatus;
import com.example.myapplication_java.databinding.ItemCommentBinding;
import com.example.myapplication_java.databinding.ItemReplyBinding;

import java.util.List;

/**
 * The adapter for comments in {@link com.example.myapplication_java.Fragments.OfferingRatingsFragment}
 */
public class CommentsAdapter extends RecyclerView.Adapter<CommentsAdapter.CommentViewHolder> {
    private List<Comment> comments;
    private OnCommentClickListener listener;

    public CommentsAdapter(List<Comment> comments, OnCommentClickListener listener) {
        this.comments = comments;
        this.listener = listener;
    }

    @NonNull
    @Override
    public CommentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemCommentBinding binding = ItemCommentBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new CommentViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull CommentViewHolder holder, int position) {
        Comment comment = comments.get(position);
        holder.userName.setText(comment.studentUsername());
        holder.commentContent.setText(comment.content());

        holder.replyButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                holder.commentBox.setVisibility(View.VISIBLE);
            }
        });

        holder.cancelButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                holder.commentBox.setVisibility(View.GONE);
            }
        });

        holder.sendReply.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                listener.onReplySend(comment.commentID(), holder.replyText.getText().toString());
            }
        });
        holder.showCommentButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (holder.visible){
                    listener.onCloseReplies(holder.getBindingAdapterPosition()+1, comment);
                } else {
                    listener.onOpenReplies(holder.getBindingAdapterPosition()+1, comment);
                }
                holder.visible = !holder.visible;
            }
        });
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    public static class CommentViewHolder extends RecyclerView.ViewHolder {

        TextView userName;
        TextView commentContent;
        ItemCommentBinding binding;
        TextView replyButton;
        TextView sendReply;
        TextView cancelButton;
        EditText replyText;
        View commentBox;
        ImageView showCommentButton;
        boolean visible;
        public CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
            ItemReplyBinding replyBinding = binding.commentBox;
            commentBox = replyBinding.getRoot();

            userName = binding.userName;
            commentContent = binding.contentText;
            replyButton = binding.replyButton;
            sendReply = replyBinding.sendReply;
            cancelButton = replyBinding.cancelButton;
            replyText = replyBinding.replyText;
            showCommentButton = binding.commentsIcon;
            visible = false;
        }

    }

    public interface OnCommentClickListener {
        void onReplySend(String commentId, String reply);
        void onOpenReplies(int position, Comment comment);
        void onCloseReplies(int position, Comment comment);
    }
}
