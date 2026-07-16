package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.ItemCommentBinding;

import java.util.List;

/**
 * The adapter for comments in {@link com.example.myapplication_java.Fragments.OfferingRatingsFragment}
 */
public class CommentsAdapter extends RecyclerView.Adapter<CommentsAdapter.CommentViewHolder> {
    private List<Comment> comments;
    private OnCommentClickListener listener;

    public CommentsAdapter(List<Comment> comments) {
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
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    public static class CommentViewHolder extends RecyclerView.ViewHolder {

        TextView userName;
        TextView commentContent;
        ItemCommentBinding binding;
        public CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());
            userName = binding.userName;
            commentContent = binding.contentText;
        }
    }

    public interface OnCommentClickListener {
        void onCommentClick(Comment comment);
    }
}
