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
import com.example.myapplication_java.databinding.ItemCommentBinding;
import com.example.myapplication_java.databinding.ItemReplyBinding;

import java.util.List;

/**
 * The adapter for comments in {@link com.example.myapplication_java.Fragments.OfferingRatingsFragment}
 *
 * <p>Answers are not a nested list: opening them inserts them into this very list right below
 * their comment, and closing them removes them again. That is why the listener methods are
 * given the position the answers belong at.</p>
 */
public class CommentsAdapter extends RecyclerView.Adapter<CommentsAdapter.CommentViewHolder> {

    private final List<Comment> comments;
    private final OnCommentClickListener listener;

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

        holder.replyButton.setOnClickListener(v -> holder.commentBox.setVisibility(View.VISIBLE));
        holder.cancelButton.setOnClickListener(v -> holder.commentBox.setVisibility(View.GONE));
        holder.sendReply.setOnClickListener(v ->
                listener.onReplySend(comment.commentID(), holder.replyText.getText().toString())
        );

        holder.showCommentButton.setOnClickListener(v -> toggleReplies(holder, comment));
    }

    /**
     * Opens or closes the answers of a comment, depending on what is currently shown.
     *
     * <p>The answers go directly below their comment, hence the position plus one. The
     * position is read from the holder instead of the bound one, because rows can be reused
     * and moved before the click happens.</p>
     */
    private void toggleReplies(CommentViewHolder holder, Comment comment) {
        int firstReplyPosition = holder.getBindingAdapterPosition() + 1;

        if (holder.repliesVisible) {
            listener.onCloseReplies(firstReplyPosition, comment);
        } else {
            listener.onOpenReplies(firstReplyPosition, comment);
        }

        holder.repliesVisible = !holder.repliesVisible;
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    /**
     * Holds the views of a single comment, including the reply box that is folded out on demand.
     */
    public static class CommentViewHolder extends RecyclerView.ViewHolder {

        final TextView userName;
        final TextView commentContent;
        final TextView replyButton;
        final TextView sendReply;
        final TextView cancelButton;
        final EditText replyText;
        final View commentBox;
        final ImageView showCommentButton;

        /**
         * Whether the answers of this comment are currently folded out.
         */
        boolean repliesVisible;

        public CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());

            // The reply box is an included layout, so its views come from their own binding.
            ItemReplyBinding replyBinding = binding.commentBox;
            commentBox = replyBinding.getRoot();

            userName = binding.userName;
            commentContent = binding.contentText;
            replyButton = binding.replyButton;
            sendReply = replyBinding.sendReply;
            cancelButton = replyBinding.cancelButton;
            replyText = replyBinding.replyText;
            showCommentButton = binding.commentsIcon;
            repliesVisible = false;
        }

    }

    /**
     * Reports what the user did with a comment. The fragment holding the list carries these
     * out, since answering needs a server request and folding needs the comment list itself.
     */
    public interface OnCommentClickListener {

        /**
         * Called when the user submitted an answer.
         *
         * @param commentId the id of the answered comment
         * @param reply     the text the user wrote
         */
        void onReplySend(String commentId, String reply);

        /**
         * Called when the answers of a comment should be shown.
         *
         * @param position the position the answers are inserted at
         * @param comment  the comment whose answers are opened
         */
        void onOpenReplies(int position, Comment comment);

        /**
         * Called when the answers of a comment should be hidden again.
         *
         * @param position the position the answers start at
         * @param comment  the comment whose answers are closed
         */
        void onCloseReplies(int position, Comment comment);
    }
}
