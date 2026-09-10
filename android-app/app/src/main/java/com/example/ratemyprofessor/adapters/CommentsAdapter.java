package com.example.ratemyprofessor.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.fragments.RatingsFragment;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.databinding.ItemCommentBinding;

import java.util.List;

/**
 * The adapter for comments in {@link RatingsFragment}
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
        System.out.println(comment.userVote());
        if (comment.userVote() == VoteType.UP) {
            holder.upVoteButton.setImageResource(R.drawable.upvote_icon_filled);
        } else if (comment.userVote() == VoteType.DOWN) {
            holder.downVoteButton.setImageResource(R.drawable.downvote_icon_filled);
        }



        holder.itemView.setOnClickListener(v -> openReplies(comment));
        holder.showCommentButton.setOnClickListener(v -> openReplies(comment));
        holder.upVoteButton.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(context, "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            holder.upVoteCount.setText(String.valueOf(comment.upVotes() + 1));
            holder.downVoteCount.setText(String.valueOf(comment.downVotes()));
            holder.upVoteButton.setImageResource(R.drawable.upvote_icon_filled);
            holder.downVoteButton.setImageResource(R.drawable.downvote_icon);
            listener.vote(comment.commentID(), VoteType.UP, type);
        });

        holder.downVoteButton.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(context, "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            holder.upVoteCount.setText(String.valueOf(comment.upVotes()));
            holder.downVoteCount.setText(String.valueOf(comment.downVotes() + 1));
            holder.upVoteButton.setImageResource(R.drawable.upvote_icon);
            holder.downVoteButton.setImageResource(R.drawable.downvote_icon_filled);
            listener.vote(comment.commentID(), VoteType.DOWN, type);
        });
        if (type == CommentType.REPLY) {
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
        final ImageView showCommentButton;
        final ImageView upVoteButton;
        final ImageView downVoteButton;
        final TextView upVoteCount;
        final TextView downVoteCount;
        final TextView commentsNum;
        final ImageButton reportButton;
        final ImageView profilePicture;


        public CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());

            profilePicture = binding.profilePicture;
            userName = binding.userName;
            commentContent = binding.contentText;
            showCommentButton = binding.commentsIcon;
            upVoteButton = binding.upvoteIcon;
            downVoteButton = binding.downvoteIcon;
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
