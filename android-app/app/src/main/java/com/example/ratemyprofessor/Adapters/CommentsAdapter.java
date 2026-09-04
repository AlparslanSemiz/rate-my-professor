package com.example.ratemyprofessor.Adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.databinding.ItemCommentBinding;
import com.example.ratemyprofessor.databinding.ItemReplyBinding;

import java.util.List;

/**
 * The adapter for comments in {@link com.example.ratemyprofessor.Fragments.OfferingRatingsFragment}
 *
 * <p>Answers are not a nested list: opening them inserts them into this very list right below
 * their comment, and closing them removes them again. That is why the listener methods are
 * given the position the answers belong at.</p>
 */
public class CommentsAdapter extends RecyclerView.Adapter<CommentsAdapter.CommentViewHolder> {

    private final List<Comment> comments;
    private final OnCommentClickListener listener;
    private final CommentType type;
    private final Context context;

    public CommentsAdapter(Context context,
                           List<Comment> comments,
                           OnCommentClickListener listener,
                           CommentType type) {
        this.context = context;
        this.comments = comments;
        this.listener = listener;
        this.type = type;
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
        if (comment.profilePicture() != null) {
            Glide.with(context)
                    .load(comment.profilePicture().replaceFirst("svg", "png"))
                    .into(holder.profilePicture);
        }

        holder.userName.setText(comment.studentUsername());
        holder.commentContent.setText(comment.content());
        holder.upVoteCount.setText(String.valueOf(comment.upVotes()));
        holder.downVoteCount.setText(String.valueOf(comment.downVotes()));

        holder.replyButton.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(context, "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            holder.commentBox.setVisibility(View.VISIBLE);
        });
        holder.cancelButton.setOnClickListener(v -> holder.commentBox.setVisibility(View.GONE));
        holder.sendReply.setOnClickListener(v ->
                {
                    listener.onReplySend(comment.commentID(), holder.replyText.getText().toString());
                    holder.replyText.getText().clear();
                    holder.replyText.clearFocus();
                    InputMethodManager imm =
                            (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
                    imm.hideSoftInputFromWindow(holder.replyText.getWindowToken(), 0);
                    holder.commentBox.setVisibility(View.GONE);
                }
        );


        holder.itemView.setOnClickListener(v -> openReplies(comment));
        holder.showCommentButton.setOnClickListener(v -> openReplies(comment));
        holder.upVoteButton.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(context, "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            holder.upVoteCount.setText(String.valueOf(comment.upVotes() + 1));
            holder.downVoteCount.setText(String.valueOf(comment.downVotes()));
            listener.vote(comment.commentID(), VoteType.UP, type);
        });

        holder.downVoteButton.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(context, "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            holder.upVoteCount.setText(String.valueOf(comment.upVotes()));
            holder.downVoteCount.setText(String.valueOf(comment.downVotes() + 1));
            listener.vote(comment.commentID(), VoteType.DOWN, type);
        });
        if (type == CommentType.REPLY) {
            holder.replyButton.setVisibility(View.INVISIBLE);
            holder.showCommentButton.setVisibility(View.INVISIBLE);
            holder.commentsNum.setVisibility(View.GONE);
            holder.reportButton.setOnClickListener(v ->listener.reportReply(comment.commentID()));
        } else {
            holder.commentsNum.setText(String.valueOf(comment.answers().size()));
            holder.reportButton.setOnClickListener(v ->listener.reportComment(comment.commentID()));
        }

    }

    /**
     * Opens or closes the answers of a comment, depending on what is currently shown.
     *
     * <p>The answers go directly below their comment, hence the position plus one. The
     * position is read from the holder instead of the bound one, because rows can be reused
     * and moved before the click happens.</p>
     */
    private void openReplies(Comment comment) {
        listener.onOpenReplies(comment);
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
        final ImageView upVoteButton;
        final ImageView downVoteButton;
        final TextView upVoteCount;
        final TextView downVoteCount;
        final TextView commentsNum;
        final ImageButton reportButton;
        final ImageView profilePicture;

        /**
         * Whether the answers of this comment are currently folded out.
         */
        boolean repliesVisible;

        public CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());

            // The reply box is an included layout, so its views come from their own binding.
            ItemReplyBinding replyBinding = binding.commentBox;
            commentBox = replyBinding.getRoot();

            profilePicture = binding.profilePicture;
            userName = binding.userName;
            commentContent = binding.contentText;
            replyButton = binding.replyButton;
            sendReply = replyBinding.sendReply;
            cancelButton = replyBinding.cancelButton;
            replyText = replyBinding.replyText;
            showCommentButton = binding.commentsIcon;
            upVoteButton = binding.upvoteIcon;
            downVoteButton = binding.downvoteIcon;
            repliesVisible = false;
            upVoteCount = binding.upvotesNum;
            downVoteCount = binding.downvotesNum;
            commentsNum = binding.commentsNum;
            reportButton = binding.reportButton;
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
         * @param comment  the comment whose answers are opened
         */
        void onOpenReplies(Comment comment);
        /**
         * For voting on a comment or answer.
         */
        void vote(String commentID, VoteType voteType, CommentType commentType);

        /**
         * for reporting comments.
         * @param commentID the ID of the comment.
         */
        void reportComment(String commentID);
        /**
         * for reporting replies.
         * @param commentID the ID of the reply.
         */
        void reportReply(String commentID);
    }
}
