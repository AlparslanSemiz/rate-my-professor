package com.example.ratemyprofessor.Fragments;

import static android.view.View.INVISIBLE;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;

import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.example.ratemyprofessor.Adapters.CommentsAdapter;
import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.LoginSession;
import com.example.ratemyprofessor.ServerCommunication.ReportReason;
import com.example.ratemyprofessor.ServerCommunication.Requests.CommentReportRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.ServerCommunication.Responses.BasicResponse;
import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;
import com.example.ratemyprofessor.ServerCommunication.Requests.VoteRequest;
import com.example.ratemyprofessor.databinding.DialogCommentReportBinding;
import com.example.ratemyprofessor.databinding.FragmentReplyBinding;
import com.example.ratemyprofessor.databinding.ItemCommentBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

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

    @Override
    public void onReplySend(String commentId, String reply) {
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
        LoginSession session = LoginSession.from(getContext());
        String authToken = session.bearerToken();
        Call<BasicResponse> call;
        if (commentType == CommentType.COMMENT) {
            call = apiService.voteComment(authToken, commentID, new VoteRequest(voteType));
            Log.println(Log.DEBUG, "Reply", "votecomment");
        } else {
            call = apiService.voteAnswer(authToken, commentID, new VoteRequest(voteType));
            Log.println(Log.DEBUG, "Reply", "voteanswer");
        }
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
        } else {
            call.enqueue(new Callback<>() {
                @Override
                public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                    if (!response.isSuccessful()) {
                        Log.println(Log.ERROR, "replyfragment", response.errorBody().toString());
                        Toast.makeText(getContext(), "Vote couldn't be sent. (fail) ", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                    Log.println(Log.ERROR, "replyfragment", throwable.getMessage());
                    Toast.makeText(getContext(), "Vote couldn't be sent(error). ", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    @Override
    public void reportComment(String commentID) {
        showCommentReportDialog(commentID, CommentType.COMMENT);
    }

    @Override
    public void reportReply(String commentID) {
        showCommentReportDialog(commentID, CommentType.REPLY);
    }

    /**
     * Opens the bug report dialog.
     */
    private void showCommentReportDialog(String commentID, CommentType type) {
        DialogCommentReportBinding dialogBinding = DialogCommentReportBinding.inflate(getLayoutInflater());

        ReportReason[] reasons = ReportReason.values();

        ArrayAdapter<ReportReason> adapter = new ArrayAdapter<>(
                getContext(),
                android.R.layout.simple_spinner_item,
                reasons
        );

        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);

        dialogBinding.reportReason.setAdapter(adapter);

        Dialog dialog = new MaterialAlertDialogBuilder(requireContext())
                .setView(dialogBinding.getRoot())
                .create();

        dialogBinding.bugReportClose.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportCancel.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportSubmit.setOnClickListener(v -> submitCommentReport(dialogBinding, dialog, commentID, type));
        dialogBinding.commentReportInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            /**
             * Clears the empty-input error once the user starts typing.
             */
            @Override
            public void afterTextChanged(Editable s) {
                dialogBinding.bugReportInputLayout.setError(null);
            }
        });

        dialog.setOnShowListener(dialogInterface -> {
            if (dialog.getWindow() != null) {
                dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            }
        });
        dialog.show();
    }
    /**
     * Validates the bug report text before closing the dialog.
     *
     * @param dialogBinding the views of the bug report dialog
     * @param dialog        the dialog to close once the report is accepted
     */
    private void submitCommentReport(DialogCommentReportBinding dialogBinding, Dialog dialog,
                                     String commentID, CommentType type) {
        String report = dialogBinding.commentReportInput.getText() == null
                ? ""
                : dialogBinding.commentReportInput.getText().toString().trim();

        // There is no bug-report endpoint yet, so this only validates local input.
        if (report.isEmpty()) {
            dialogBinding.bugReportInputLayout.setError(getString(R.string.bug_report_empty_error));
            return;
        }

        ReportReason reason = (ReportReason) dialogBinding.reportReason.getSelectedItem();
        CommentReportRequest request = new CommentReportRequest(commentID, reason, report);
        Call<BasicResponse> reportCall;
        String authToken = LoginSession.from(getContext()).bearerToken();
        if (type == CommentType.COMMENT) {
            reportCall = apiService.reportComment(authToken, request);
        } else {
            reportCall = apiService.reportReply(authToken, request);
        }
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
        } else {
            reportCall.enqueue(new Callback<BasicResponse>() {
                @Override
                public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                    BasicResponse body = response.body();
                    if (!response.isSuccessful() || body == null || !body.success()) {
                        Log.println(Log.DEBUG, "comment report", "failure: " + response.code());
                    }
                }

                @Override
                public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                    Log.println(Log.DEBUG, "comment report", "failure: " + throwable.getMessage());
                }
            });
            dialogBinding.bugReportInputLayout.setError(null);
            Toast.makeText(requireContext(), R.string.bug_report_submitted, Toast.LENGTH_SHORT).show();
        }
        dialog.dismiss();
    }
}
