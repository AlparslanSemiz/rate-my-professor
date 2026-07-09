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

import java.util.List;

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
        View view = LayoutInflater.from(parent.getContext()).
                inflate(R.layout.item_comment, parent, false);
        return new CommentViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CommentViewHolder holder, int position) {
        Comment comment = comments.get(position);
        holder.userName.setText(comment.studentUsername);
        holder.commentContent.setText(comment.content);
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    public static class CommentViewHolder extends RecyclerView.ViewHolder {

        TextView userName;
        TextView commentContent;
        public CommentViewHolder(View itemview) {
            super(itemview);
            userName = itemview.findViewById(R.id.user_name);
            commentContent = itemview.findViewById(R.id.content_text);
        }
    }

    public interface OnCommentClickListener {
        void onCommentClick(Comment comment);
    }
}
