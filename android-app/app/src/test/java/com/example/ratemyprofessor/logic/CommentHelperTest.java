package com.example.ratemyprofessor.logic;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import android.app.Dialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.widget.Spinner;

import androidx.test.core.app.ApplicationProvider;

import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.LoginSession;
import com.example.ratemyprofessor.ServerCommunication.ReportReason;
import com.example.ratemyprofessor.ServerCommunication.Requests.CommentReportRequest;
import com.example.ratemyprofessor.ServerCommunication.Responses.BasicResponse;
import com.example.ratemyprofessor.databinding.DialogCommentReportBinding;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 35)
public class CommentHelperTest {

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
}