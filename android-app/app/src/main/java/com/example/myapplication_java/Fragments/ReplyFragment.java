package com.example.myapplication_java.Fragments;

import android.app.Dialog;
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
import android.widget.ArrayAdapter;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.example.myapplication_java.Adapters.CommentsAdapter;
import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.CommentType;
import com.example.myapplication_java.DomainModel.VoteType;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.NetworkUtils;
import com.example.myapplication_java.ServerCommunication.ReportReason;
import com.example.myapplication_java.ServerCommunication.Requests.CommentReportRequest;
import com.example.myapplication_java.ServerCommunication.Responses.BasicResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.Requests.VoteRequest;
import com.example.myapplication_java.databinding.DialogCommentReportBinding;
import com.example.myapplication_java.databinding.FragmentReplyBinding;
import com.example.myapplication_java.databinding.ItemCommentBinding;
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

        mainComment.replyButton.setOnClickListener(v -> mainComment.commentBox.getRoot().setVisibility(View.VISIBLE));
        mainComment.commentBox.cancelButton.setOnClickListener(v -> mainComment.commentBox.getRoot().setVisibility(View.GONE));
        mainComment.commentBox.sendReply.setOnClickListener(v ->
                onReplySend(comment.commentID(), mainComment.commentBox.replyText.getText().toString())
        );


        mainComment.commentsIcon.setOnClickListener(v -> onOpenReplies(comment));
        mainComment.upvoteIcon.setOnClickListener(v -> {
            mainComment.upvotesNum.setText(String.valueOf(comment.upVotes() + 1));
            mainComment.downvotesNum.setText(String.valueOf(comment.downVotes()));
            vote(comment.commentID(), VoteType.UP, CommentType.COMMENT);
        });

        mainComment.downvoteIcon.setOnClickListener(v -> {
            mainComment.upvotesNum.setText(String.valueOf(comment.upVotes()));
            mainComment.downvotesNum.setText(String.valueOf(comment.downVotes() + 1));
            vote(comment.commentID(), VoteType.DOWN, CommentType.COMMENT);
        });
        mainComment.replyButton.setVisibility(View.INVISIBLE);
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
        if (!NetworkUtils.isInternetAvailable(getContext())) {
            Toast.makeText(getContext(), "Internet not available", Toast.LENGTH_SHORT).show();
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
        if (!NetworkUtils.isInternetAvailable(getContext())) {
            Toast.makeText(getContext(), "Internet not available", Toast.LENGTH_SHORT).show();
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
