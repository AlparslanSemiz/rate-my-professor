package com.example.ratemyprofessor.logic;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.ReportReason;
import com.example.ratemyprofessor.servercommunication.requests.CommentReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.VoteRequest;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.databinding.DialogCommentReportBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;



import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Provides dialogs and backend requests for reporting and voting on comments and replies.
 */
public final class CommentHelper {
    private CommentHelper() {
        // static helper class
    }

    /**
     * Submits the selected report reason and text for a comment or reply when the user is logged in.
     *
     * @param context the Android context used to access resources and services
     * @param apiService the service used to create backend requests
     * @param dialogBinding the binding containing the selected reason and report text
     * @param dialog the report dialog to dismiss
     * @param commentID the identifier of the comment
     * @param type whether the target is a comment or a reply
     */
    public static void submitCommentReport(Context context,
                                            APIService apiService,
                                            DialogCommentReportBinding dialogBinding, Dialog dialog,
                                            String commentID, CommentType type) {

        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(
                    context,
                    "You are not logged in.",
                    Toast.LENGTH_SHORT
            ).show();

            dialog.dismiss();
            return;
        }

        String report = dialogBinding.commentReportInput.getText() == null
                ? ""
                : dialogBinding.commentReportInput.getText().toString().trim();


        ReportReason reason = (ReportReason) dialogBinding.reportReason.getSelectedItem();
        CommentReportRequest request = new CommentReportRequest(commentID, reason, report);
        Call<BasicResponse> reportCall;
        String authToken = LoginSession.from(context).bearerToken();

        if (type == CommentType.COMMENT) {
            reportCall = apiService.reportComment(authToken, request);
        } else {
            reportCall = apiService.reportReply(authToken, request);
        }

        reportCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<BasicResponse> call, @NonNull Response<BasicResponse> response) {
                BasicResponse body = response.body();
                if (!response.isSuccessful() || body == null || !body.success()) {
                    Log.println(Log.DEBUG, "comment report", "failure: " + response.code());
                }
            }

            @Override
            public void onFailure(@NonNull Call<BasicResponse> call, @NonNull Throwable throwable) {
                Log.println(Log.DEBUG, "comment report", "failure: " + throwable.getMessage());
            }
        });

        dialogBinding.bugReportInputLayout.setError(null);
        Toast.makeText(context, R.string.bug_report_submitted, Toast.LENGTH_SHORT).show();

        dialog.dismiss();
    }

    /**
     * Displays a dialog for selecting a report reason and entering an explanation.
     *
     * @param layoutInflater the inflater used to create the report dialog
     * @param apiService the service used to create backend requests
     * @param context the Android context used to access resources and services
     * @param commentID the identifier of the comment
     * @param type whether the target is a comment or a reply
     */
    public static void showCommentReportDialog(LayoutInflater layoutInflater, APIService apiService, Context context, String commentID, CommentType type) {
        DialogCommentReportBinding dialogBinding = DialogCommentReportBinding.inflate(layoutInflater);

        ReportReason[] reasons = ReportReason.values();

        ArrayAdapter<ReportReason> adapter = new ArrayAdapter<>(
                context,
                android.R.layout.simple_spinner_item,
                reasons
        );

        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);

        dialogBinding.reportReason.setAdapter(adapter);

        Dialog dialog = new MaterialAlertDialogBuilder(context)
                .setView(dialogBinding.getRoot())
                .create();

        dialogBinding.bugReportCancel.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportSubmit.setOnClickListener(v -> CommentHelper.submitCommentReport(context, apiService, dialogBinding, dialog, commentID, type));
        dialogBinding.commentReportInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            /**
             * Clears the empty-input error once the user starts typing.
             *
             * @param s the updated editable text
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
     * Submits a vote on a comment or reply when the user is logged in and displays request failures.
     *
     * @param context the Android context used to access resources and services
     * @param apiService the service used to create backend requests
     * @param commentID the identifier of the comment
     * @param voteType the vote associated with the comment
     * @param commentType whether the target is a comment or a reply
     */
    public static void vote(Context context, APIService apiService, String commentID, VoteType voteType, CommentType commentType) {
        LoginSession session = LoginSession.from(context);
        String authToken = session.bearerToken();
        Call<BasicResponse> call;
        if (commentType == CommentType.COMMENT) {
            call = apiService.voteComment(authToken, commentID, new VoteRequest(voteType));
        } else {
            call = apiService.voteAnswer(authToken, commentID, new VoteRequest(voteType));
        }
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(context, "You are not logged in.", Toast.LENGTH_SHORT).show();
        } else {
            call.enqueue(new Callback<>() {
                @Override
                public void onResponse(@NonNull Call<BasicResponse> call, @NonNull Response<BasicResponse> response) {
                    if (!response.isSuccessful()) {
                        Toast.makeText(context, "Vote couldn't be sent.", Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(@NonNull Call<BasicResponse> call, @NonNull Throwable throwable) {
                    Toast.makeText(context, "Vote couldn't be sent.", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
