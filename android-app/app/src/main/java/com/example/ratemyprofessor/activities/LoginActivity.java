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
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.example.ratemyprofessor.BuildConfig;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.requests.LoginRequest;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.example.ratemyprofessor.databinding.ActivityLoginBinding;

import java.io.IOException;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * First step of the login: the user enters their email address and the server sends a
 * one-time token to it. The token itself is entered on {@link EnterAuthTokenActivity}.
 */
public class LoginActivity extends AppCompatActivity {

    private static final String TAG = "login";

    private EditText emailInput;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getIntent().getBooleanExtra("skip_login", true) && BuildConfig.SKIP_LOGIN) {
            openMainScreenWithoutLogin();
            return;
        }

        EdgeToEdge.enable(this);
        ActivityLoginBinding binding = ActivityLoginBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        setContentView(view);
        ViewCompat.setOnApplyWindowInsetsListener(binding.main, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        Button enterButton = binding.verifyButton;
        emailInput = binding.mailInput;

        enterButton.setOnClickListener(v -> requestLoginToken(emailInput.getText().toString()));
    }

    /**
     * Opens the main screen without a login, for debug builds that skip the login flow.
     *
     * <p>Finishing this screen is what makes the shortcut safe. An unfinished login screen
     * stays alive underneath the main screen, and every configuration change, dark mode
     * included, recreates it and runs this method again, which would put a second main screen
     * on top and throw the user out of whatever they were doing.</p>
     */
    private void openMainScreenWithoutLogin() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }

    /**
     * Asks the server to send a one-time token to the given address and, once that worked,
     * continues to the screen where the token is entered.
     *
     * @param mailAddress the address the user typed
     */
    private void requestLoginToken(String mailAddress) {
        if (!mailAddress.matches("[A-Za-z]{5}@student.kit.edu")){
            Toast.makeText(this, "the email is wrong. You must use a KIT student email.", Toast.LENGTH_SHORT).show();
            return;
        }
        String trimmedMailAddress = mailAddress.trim();

        // An empty field would make the server reject the request, so it is caught here where
        // the user can still be told what is missing.
        if (trimmedMailAddress.isEmpty()) {
            Toast.makeText(this, R.string.login_missing_mail, Toast.LENGTH_SHORT).show();
            return;
        }

        APIService apiService = RetrofitClient.getClient().create(APIService.class);

        LoginRequest request = new LoginRequest(trimmedMailAddress, "");
        Call<ServerResponse> call = apiService.requestLogin(request);
        Intent enterAuthTokenActivity = new Intent(this, EnterAuthTokenActivity.class);

        /// 'call.enqueue' executes the request to the server.
        /// 'callback' specifies how to handle the answer of the request.
        if (!NetworkUtils.isInternetAvailable(this)) {
            Toast.makeText(this, "Internet not available", Toast.LENGTH_SHORT).show();
        } else {
            call.enqueue(new Callback<>() {
                @Override
                public void onResponse(@NonNull Call<ServerResponse> call, @NonNull Response<ServerResponse> response) {
                    ServerResponse body = response.body();

                    // A rejected request comes back without a usable body, and the server can also
                    // answer with 200 and success=false. Both mean no token was sent, so neither
                    // may continue to the screen that asks for one.
                    if (!response.isSuccessful() || body == null || !body.success()) {
                        Log.e(TAG, readErrorMessage(response));

                        String message = body == null || body.message() == null || body.message().isEmpty()
                                ? getString(R.string.login_request_failed)
                                : body.message();
                        Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();
                        return;
                    }

                    /// 'SharedPreferences' is used to save data (at the moment just the email)
                    /// persistently, even when the app is closed
                    LoginSession.from(LoginActivity.this).saveMailAddress(trimmedMailAddress);

                    Toast.makeText(
                            LoginActivity.this,
                            getString(R.string.login_token_sent, trimmedMailAddress),
                            Toast.LENGTH_LONG
                    ).show();
                    LoginActivity.this.startActivity(enterAuthTokenActivity);
                }

                @Override
                public void onFailure(@NonNull Call<ServerResponse> call,@NonNull Throwable t) {
                    Log.e(TAG, "request-login failed: " + t);
                    Toast.makeText(
                            LoginActivity.this,
                            R.string.login_server_unreachable,
                            Toast.LENGTH_LONG
                    ).show();
                }
            });
        }
    }

    /**
     * Reads what the server sent along with a failed request.
     *
     * <p>The error body is missing on some failures, and calling toString() on it would print
     * the object itself rather than its content, so both cases fall back to the status code.</p>
     *
     * @param response the unsuccessful response
     * @return the error text of the server, or the status code when it cannot be read
     */
    private static String readErrorMessage(Response<?> response) {
        if (response.errorBody() == null) {
            return "request failed with status " + response.code();
        }

        try {
            return response.errorBody().string();
        } catch (IOException exception) {
            return "request failed with status " + response.code();
        }
    }
}
