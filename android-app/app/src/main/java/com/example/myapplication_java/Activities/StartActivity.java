package com.example.myapplication_java.Activities;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Requests.LoginRequest;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Requests.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * This Activity is the entry point of the program. We check whether the user is already logged in,
 * and then forward the program towards either Login- or MainActivity accordingly.
 *
 * <p>The saved login is not trusted blindly: the server is asked whether it is still valid,
 * because an account can be deleted or a token revoked while the app was closed. Whenever that
 * check cannot be passed, the user lands on the login screen.</p>
 */
public class StartActivity extends AppCompatActivity {

    private static final String TAG = "login";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LoginSession session = LoginSession.from(this);

        //debug
        Log.d(TAG, "mail :" + session.mailAddress() + " otp: " + session.loginToken());

        if (!session.isLoggedIn()) {
            openScreen(LoginActivity.class);
            return;
        }

        validateSavedLogin(session);
    }

    /**
     * Asks the server whether the saved login is still accepted and routes accordingly.
     */
    private void validateSavedLogin(LoginSession session) {
        LoginRequest request = new LoginRequest(session.mailAddress(), session.loginToken());
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<ServerResponse> call = apiService.validate(session.bearerToken(), request);

        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                openScreen(response.isSuccessful() ? MainActivity.class : LoginActivity.class);
            }

            @Override
            public void onFailure(Call<ServerResponse> call, Throwable t) {
                Log.e(TAG, "Error: " + t.getMessage());
                openScreen(LoginActivity.class);
            }
        });
    }

    /**
     * Opens the given screen and closes this one.
     *
     * @param screen the activity to continue with
     */
    private void openScreen(Class<?> screen) {
        startActivity(new Intent(this, screen));
        finish(); // StartActivity can be closed, as it will be not accessed again
    }
}
