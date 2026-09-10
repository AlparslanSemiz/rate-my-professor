package com.example.ratemyprofessor.activities;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.requests.LoginRequest;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.example.ratemyprofessor.databinding.ActivityEnterAuthTokenBinding;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Second step of the login: the user enters the one-time token that
 * {@link LoginActivity} had sent to their email address.
 *
 * <p>On success both the token and the auth token returned by the server are saved, which
 * lets {@link StartActivity} skip the login on the next app start.</p>
 */
public class EnterAuthTokenActivity extends AppCompatActivity {

    private static final String TAG = "login response ___";

    private EditText tokenInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        ActivityEnterAuthTokenBinding binding = ActivityEnterAuthTokenBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        setContentView(view);

        Button continueButton = binding.enterButton;
        tokenInput = binding.codeInput;

        continueButton.setOnClickListener(v -> submitToken(tokenInput.getText().toString()));
    }

    /**
     * Verifies the entered token together with the saved email address and, on success,
     * continues to the main screen.
     *
     * @param token the one-time token the user typed
     */
    private void submitToken(String token) {
        APIService apiService = RetrofitClient.getClient().create(APIService.class);

        /// 'SharedPreferences' is used to save data (currently just the email)
        /// persistently, even when the app is closed
        LoginSession session = LoginSession.from(this);
        LoginRequest request = new LoginRequest(session.mailAddress(), token);

        Call<ServerResponse> call = apiService.login(request);

        // Both login screens are done once the token is accepted. Clearing the task drops them,
        // so a back press from the main screen leaves the app instead of returning to the login,
        // and no finished login screen is left behind to be restored on a configuration change.
        Intent mainActivity = new Intent(this, MainActivity.class);
        mainActivity.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        if (!NetworkUtils.isInternetAvailable(this)) {
            Toast.makeText(this, "Internet not available", Toast.LENGTH_SHORT).show();
        } else {
            call.enqueue(new Callback<>() {
                @Override
                public void onResponse(@NonNull Call<ServerResponse> call, @NonNull Response<ServerResponse> response) {
                    ServerResponse body = response.body();

                    // A rejected login comes back without a body, so it has to be checked before
                    // reading the success flag out of it.
                    if (!response.isSuccessful() || body == null || !body.success()) {
                        Log.d(TAG, "failure: " + response.code());

                        // Without a body the server did not judge the token at all, which is a
                        // problem on its side rather than a wrong code the user could correct.
                        String message = body == null || body.message() == null || body.message().isEmpty()
                                ? getString(response.isSuccessful()
                                ? R.string.login_failed
                                : R.string.login_server_unreachable)
                                : body.message();
                        Toast.makeText(EnterAuthTokenActivity.this, message, Toast.LENGTH_LONG).show();
                        return;
                    }

                    Log.d(TAG, "success!!");

                    // Saving the OneTimePassword for future logins
                    session.saveTokens(token, body.authToken());
                    AuthManager.getInstance().setAuthState(AuthState.LOGGED_IN);
                    EnterAuthTokenActivity.this.startActivity(mainActivity);
                }

                @Override
                public void onFailure(@NonNull Call<ServerResponse> call,@NonNull Throwable t) {
                    Log.e(TAG, "login failed: " + t);
                    Toast.makeText(
                            EnterAuthTokenActivity.this,
                            R.string.login_server_unreachable,
                            Toast.LENGTH_LONG
                    ).show();
                }
            });
        }

    }
}
