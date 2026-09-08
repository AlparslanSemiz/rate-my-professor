package com.example.ratemyprofessor.Fragments;

import static android.view.View.INVISIBLE;

import android.content.Context;
import android.os.Bundle;

import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.example.ratemyprofessor.Adapters.CommentsAdapter;
import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.LoginSession;
import com.example.ratemyprofessor.ServerCommunication.Requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.ServerCommunication.Responses.BasicResponse;
import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.FragmentReplyBinding;
import com.example.ratemyprofessor.databinding.ItemCommentBinding;
import com.example.ratemyprofessor.logic.CommentHelper;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * It is the fragment that displays the replies to a comment.
 */
public class ReplyFragment extends Fragment implements CommentsAdapter.OnCommentClickListener {

    private Comment comment;
    private FragmentReplyBinding binding;
    private RecyclerView answerList;
    private APIService apiService;

    public ReplyFragment() {
        apiService = RetrofitClient.getClient().create(APIService.class);
        // Required empty public constructor
    }
    public ReplyFragment(Comment comment) {
        apiService = RetrofitClient.getClient().create(APIService.class);
        this.comment = comment;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentReplyBinding.inflate(inflater, container, false);
        answerList = binding.answerList;
        ItemCommentBinding mainComment = binding.mainComment;
        binding.backButton.setOnClickListener(v ->
                getParentFragmentManager().popBackStack()
        );

        if (comment.profilePicture() != null) {
            Glide.with(getContext())
                    .load(comment.profilePicture().replaceFirst("svg", "png"))
                    .into(mainComment.profilePicture);
        }

        mainComment.userName.setText(comment.studentUsername());
        mainComment.contentText.setText(comment.content());
        mainComment.upvotesNum.setText(String.valueOf(comment.upVotes()));
        mainComment.downvotesNum.setText(String.valueOf(comment.downVotes()));

        binding.cancelReply.setVisibility(INVISIBLE);
        binding.submitReply.setEnabled(false);

        binding.inputReply.setOnFocusChangeListener((view, hasFocus) -> {
            binding.cancelReply.setVisibility(
                    hasFocus ? View.VISIBLE : View.INVISIBLE
            );
        });
        binding.inputReply.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence text, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence text, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable text) {
                boolean hasText = !text.toString().trim().isEmpty();

                binding.submitReply.setEnabled(hasText);
            }
        });

        binding.submitReply.setOnClickListener(v ->
                onReplySend(comment.commentID(), binding.inputReply.getText().toString()));
        binding.cancelReply.setOnClickListener(v -> {
            binding.inputReply.getText().clear();
            binding.inputReply.clearFocus();
            InputMethodManager imm = (InputMethodManager)
                    requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(binding.inputReply.getWindowToken(), 0);
        });


        mainComment.commentsIcon.setOnClickListener(v -> onOpenReplies(comment));
        mainComment.upvoteIcon.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            mainComment.upvotesNum.setText(String.valueOf(comment.upVotes() + 1));
            mainComment.downvotesNum.setText(String.valueOf(comment.downVotes()));
            vote(comment.commentID(), VoteType.UP, CommentType.COMMENT);
        });

        mainComment.downvoteIcon.setOnClickListener(v -> {
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
                return;
            }
            mainComment.upvotesNum.setText(String.valueOf(comment.upVotes()));
            mainComment.downvotesNum.setText(String.valueOf(comment.downVotes() + 1));
            vote(comment.commentID(), VoteType.DOWN, CommentType.COMMENT);
        });
        mainComment.commentsIcon.setOnClickListener(v -> {});
        mainComment.commentsNum.setText(String.valueOf(comment.answers().size()));
        mainComment.reportButton.setOnClickListener(v ->reportComment(comment.commentID()));

        answerList.setLayoutManager(new LinearLayoutManager(getContext()));
        List<Comment> answers = comment.answers();
        CommentsAdapter adapter = new CommentsAdapter(getContext(), answers, this, CommentType.REPLY);
        answerList.setAdapter(adapter);
        return binding.getRoot();
    }

    private void onReplySend(String commentId, String reply) {
        String trimmedReply = reply.trim();
        if (trimmedReply.isEmpty()) {
            binding.inputReply.setError("Please enter a reply.");
            return;
        }

        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(requireContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            return;
        }

        String token = LoginSession.from(requireContext()).bearerToken();
        binding.submitReply.setEnabled(false);
        apiService.postAnswer(token, new SubmitAnswerRequest(commentId, trimmedReply))
                .enqueue(new Callback<BasicResponse>() {
                    @Override
                    public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                        if (!isAdded() || binding == null) {
                            return;
                        }
                        binding.submitReply.setEnabled(true);
                        BasicResponse body = response.body();
                        if (!response.isSuccessful() || body == null || !body.success()) {
                            Toast.makeText(requireContext(), "Reply couldn't be sent.", Toast.LENGTH_SHORT).show();
                            return;
                        }

                        binding.inputReply.getText().clear();
                        binding.inputReply.clearFocus();
                        InputMethodManager imm = (InputMethodManager)
                                requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                        imm.hideSoftInputFromWindow(binding.inputReply.getWindowToken(), 0);
                        Toast.makeText(requireContext(), "Reply sent.", Toast.LENGTH_SHORT).show();
                    }

                    @Override
                    public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                        if (!isAdded() || binding == null) {
                            return;
                        }
                        binding.submitReply.setEnabled(true);
                        Toast.makeText(requireContext(), "Reply couldn't be sent.", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    @Override
    public void onOpenReplies(Comment comment) {
    }

    @Override
    public void vote(String commentID, VoteType voteType, CommentType commentType) {
        CommentHelper.vote(getContext(), apiService, commentID, voteType, commentType);
    }

    @Override
    public void reportComment(String commentID) {
        CommentHelper.showCommentReportDialog(getLayoutInflater(), apiService, getContext(), commentID, CommentType.COMMENT);
    }

    @Override
    public void reportReply(String commentID) {
        CommentHelper.showCommentReportDialog(getLayoutInflater(), apiService, getContext(), commentID, CommentType.REPLY);
    }


}
