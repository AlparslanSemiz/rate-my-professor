package com.example.ratemyprofessor.logic;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import android.app.Dialog;
import android.content.Context;
import android.view.LayoutInflater;

import androidx.test.core.app.ApplicationProvider;

import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.requests.CommentReportRequest;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.databinding.DialogCommentReportBinding;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Tests comment helper behavior.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 35)
public class CommentHelperTest {

    /**
     * Verifies that voting while logged out displays a login message.
     */
    @Test
    public void vote_notLoggedIn() {
        Context context =
                ApplicationProvider.getApplicationContext();

        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        AuthManager authManager = mock(AuthManager.class);

        when(authManager.isLoggedIn()).thenReturn(false);

        when(apiService.voteComment(
                anyString(),
                eq("comment-1"),
                any()
        )).thenReturn(call);

        try (MockedStatic<AuthManager> authMock =
                     mockStatic(AuthManager.class)) {

            authMock.when(AuthManager::getInstance)
                    .thenReturn(authManager);

            CommentHelper.vote(
                    context,
                    apiService,
                    "comment-1",
                    VoteType.UP,
                    CommentType.COMMENT
            );

            verify(call, never()).enqueue(any());
        }
    }

    /**
     * Verifies that logged-in users submit votes through the comment endpoint.
     */
    @Test
    public void vote_loggedIn_comment() {
        Context context =
                ApplicationProvider.getApplicationContext();

        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        AuthManager authManager = mock(AuthManager.class);

        when(authManager.isLoggedIn()).thenReturn(true);

        when(apiService.voteComment(
                anyString(),
                eq("comment-1"),
                any()
        )).thenReturn(call);

        try (MockedStatic<AuthManager> authMock =
                     mockStatic(AuthManager.class)) {

            authMock.when(AuthManager::getInstance)
                    .thenReturn(authManager);

            CommentHelper.vote(
                    context,
                    apiService,
                    "comment-1",
                    VoteType.UP,
                    CommentType.COMMENT
            );

            verify(apiService).voteComment(
                    anyString(),
                    eq("comment-1"),
                    any()
            );

            verify(call).enqueue(any());
        }
    }

    /**
     * Verifies that logged-in users submit votes through the reply endpoint.
     */
    @Test
    public void vote_loggedIn_reply() {
        Context context =
                ApplicationProvider.getApplicationContext();

        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        AuthManager authManager = mock(AuthManager.class);

        when(authManager.isLoggedIn()).thenReturn(true);

        when(apiService.voteAnswer(
                anyString(),
                eq("answer-1"),
                any()
        )).thenReturn(call);

        try (MockedStatic<AuthManager> authMock =
                     mockStatic(AuthManager.class)) {

            authMock.when(AuthManager::getInstance)
                    .thenReturn(authManager);

            CommentHelper.vote(
                    context,
                    apiService,
                    "answer-1",
                    VoteType.DOWN,
                    CommentType.REPLY
            );

            verify(apiService).voteAnswer(
                    anyString(),
                    eq("answer-1"),
                    any()
            );

            verify(call).enqueue(any());
        }
    }

    /**
     * Verifies that a failed vote request displays an error message.
     */
    @Test
    public void vote_callbackFailure() {
        Context context =
                ApplicationProvider.getApplicationContext();

        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        AuthManager authManager = mock(AuthManager.class);

        when(authManager.isLoggedIn()).thenReturn(true);

        when(apiService.voteComment(
                anyString(),
                eq("comment-1"),
                any()
        )).thenReturn(call);

        try (MockedStatic<AuthManager> authMock =
                     mockStatic(AuthManager.class)) {

            authMock.when(AuthManager::getInstance)
                    .thenReturn(authManager);

            CommentHelper.vote(
                    context,
                    apiService,
                    "comment-1",
                    VoteType.UP,
                    CommentType.COMMENT
            );

            ArgumentCaptor<Callback<BasicResponse>> captor =
                    ArgumentCaptor.forClass(Callback.class);

            verify(call).enqueue(captor.capture());

            Callback<BasicResponse> callback = captor.getValue();

            // onFailure()
            callback.onFailure(
                    call,
                    new RuntimeException("network error")
            );

            // onResponse() mit HTTP-Fehler
            Response<BasicResponse> response = Response.error(
                    400,
                    ResponseBody.create(
                            null,
                            new byte[0]
                    )
            );

            callback.onResponse(call, response);
        }
    }

    /**
     * Verifies that a successful vote response is handled.
     */
    @Test
    public void vote_callbackSuccess() {
        Context context = ApplicationProvider.getApplicationContext();
        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        AuthManager authManager = mock(AuthManager.class);

        when(authManager.isLoggedIn()).thenReturn(true);
        when(apiService.voteComment(anyString(), eq("comment-1"), any())).thenReturn(call);

        try (MockedStatic<AuthManager> authMock = mockStatic(AuthManager.class)) {
            authMock.when(AuthManager::getInstance).thenReturn(authManager);

            CommentHelper.vote(
                    context,
                    apiService,
                    "comment-1",
                    VoteType.UP,
                    CommentType.COMMENT
            );

            ArgumentCaptor<Callback<BasicResponse>> captor =
                    ArgumentCaptor.forClass(Callback.class);
            verify(call).enqueue(captor.capture());

            captor.getValue().onResponse(
                    call,
                    Response.success(new BasicResponse("ok", true))
            );
        }
    }

    /**
     * Verifies that a logged-in user can submit a comment report.
     */
    @Test
    public void submitCommentReport_loggedIn_success_comment() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        Dialog dialog = mock(Dialog.class);
        AuthManager authManager = mock(AuthManager.class);
        LoginSession session = mock(LoginSession.class);

        when(authManager.isLoggedIn()).thenReturn(true);
        when(session.bearerToken()).thenReturn("token");
        when(apiService.reportComment(anyString(), any())).thenReturn(call);

        DialogCommentReportBinding binding = DialogCommentReportBinding.inflate(LayoutInflater.from(context));
        binding.commentReportInput.setText("Report text");
        binding.reportReason.setSelection(0);

        try (MockedStatic<AuthManager> authMock = mockStatic(AuthManager.class);
             MockedStatic<LoginSession> sessionMock = mockStatic(LoginSession.class)) {
            authMock.when(AuthManager::getInstance).thenReturn(authManager);
            sessionMock.when(() -> LoginSession.from(any())).thenReturn(session);

            CommentHelper.submitCommentReport(context, apiService, binding, dialog, "c1", CommentType.COMMENT);

            verify(apiService).reportComment(eq("token"), any(CommentReportRequest.class));
            
            ArgumentCaptor<Callback<BasicResponse>> captor = ArgumentCaptor.forClass(Callback.class);
            verify(call).enqueue(captor.capture());
            
            // Trigger callbacks
            captor.getValue().onResponse(call, Response.success(new BasicResponse("ok", true)));
            captor.getValue().onFailure(call, new RuntimeException("error"));

            verify(dialog).dismiss();
        }
    }

    /**
     * Verifies that a logged-in user can submit a reply report.
     */
    @Test
    public void submitCommentReport_loggedIn_success_reply() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        Dialog dialog = mock(Dialog.class);
        AuthManager authManager = mock(AuthManager.class);
        LoginSession session = mock(LoginSession.class);

        when(authManager.isLoggedIn()).thenReturn(true);
        when(session.bearerToken()).thenReturn("token");
        when(apiService.reportReply(anyString(), any())).thenReturn(call);

        DialogCommentReportBinding binding = DialogCommentReportBinding.inflate(LayoutInflater.from(context));

        try (MockedStatic<AuthManager> authMock = mockStatic(AuthManager.class);
             MockedStatic<LoginSession> sessionMock = mockStatic(LoginSession.class)) {
            authMock.when(AuthManager::getInstance).thenReturn(authManager);
            sessionMock.when(() -> LoginSession.from(any())).thenReturn(session);

            CommentHelper.submitCommentReport(context, apiService, binding, dialog, "c1", CommentType.REPLY);

            verify(apiService).reportReply(eq("token"), any(CommentReportRequest.class));
            verify(call).enqueue(any());
        }
    }

    /**
     * Verifies that unsuccessful report responses are handled.
     */
    @Test
    public void submitCommentReport_callbackHandlesAllFailureResponses() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        APIService apiService = mock(APIService.class);
        Call<BasicResponse> call = mock(Call.class);
        Dialog dialog = mock(Dialog.class);
        AuthManager authManager = mock(AuthManager.class);
        LoginSession session = mock(LoginSession.class);

        when(authManager.isLoggedIn()).thenReturn(true);
        when(session.bearerToken()).thenReturn("token");
        when(apiService.reportComment(anyString(), any())).thenReturn(call);

        DialogCommentReportBinding binding =
                DialogCommentReportBinding.inflate(LayoutInflater.from(context));
        binding.reportReason.setSelection(0);

        try (MockedStatic<AuthManager> authMock = mockStatic(AuthManager.class);
             MockedStatic<LoginSession> sessionMock = mockStatic(LoginSession.class)) {
            authMock.when(AuthManager::getInstance).thenReturn(authManager);
            sessionMock.when(() -> LoginSession.from(any())).thenReturn(session);

            for (int index = 0; index < 3; index++) {
                CommentHelper.submitCommentReport(
                        context,
                        apiService,
                        binding,
                        dialog,
                        "c1",
                        CommentType.COMMENT
                );
            }

            ArgumentCaptor<Callback<BasicResponse>> captor =
                    ArgumentCaptor.forClass(Callback.class);
            verify(call, times(3)).enqueue(captor.capture());

            captor.getAllValues().get(0).onResponse(
                    call,
                    Response.error(400, ResponseBody.create(null, new byte[0]))
            );
            captor.getAllValues().get(1).onResponse(call, Response.success(null));
            captor.getAllValues().get(2).onResponse(
                    call,
                    Response.success(new BasicResponse("rejected", false))
            );
        }
    }

    /**
     * Verifies that reporting while logged out displays a login message.
     */
    @Test
    public void submitCommentReport_notLoggedIn_showsToast() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        APIService apiService = mock(APIService.class);
        Dialog dialog = mock(Dialog.class);
        AuthManager authManager = mock(AuthManager.class);

        when(authManager.isLoggedIn()).thenReturn(false);

        DialogCommentReportBinding binding = DialogCommentReportBinding.inflate(LayoutInflater.from(context));

        try (MockedStatic<AuthManager> authMock = mockStatic(AuthManager.class)) {
            authMock.when(AuthManager::getInstance).thenReturn(authManager);

            CommentHelper.submitCommentReport(context, apiService, binding, dialog, "c1", CommentType.COMMENT);

            verify(apiService, never()).reportComment(anyString(), any());
            verify(dialog).dismiss();
        }
    }

    /**
     * Verifies that show comment report dialog creates and shows dialog.
     */
    @Test
    public void showCommentReportDialog_createsAndShowsDialog() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        APIService apiService = mock(APIService.class);
        LayoutInflater inflater = LayoutInflater.from(context);

        CommentHelper.showCommentReportDialog(inflater, apiService, context, "c1", CommentType.COMMENT);

        // Verifies that a dialog was actually created and shown in the Robolectric environment
        Dialog lastDialog = org.robolectric.shadows.ShadowAlertDialog.getLatestDialog();
        assertNotNull(lastDialog);
        assertTrue(lastDialog.isShowing());

        // Trigger listeners
        android.app.Dialog dialog = org.robolectric.shadows.ShadowAlertDialog.getLatestDialog();
        assertNotNull(dialog);
        android.widget.EditText input = dialog.findViewById(R.id.comment_report_input);
        android.widget.Button cancel = dialog.findViewById(R.id.bug_report_cancel);

        input.setText("Some text"); // Trigger afterTextChanged
        cancel.performClick(); // Trigger cancel listener
        assertFalse(lastDialog.isShowing());
    }
}
