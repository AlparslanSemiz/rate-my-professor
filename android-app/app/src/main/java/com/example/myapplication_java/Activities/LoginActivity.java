package com.example.myapplication_java.Activities;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;
import com.example.myapplication_java.databinding.ActivityLoginBinding;

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

    private ActivityLoginBinding binding;
    private Button enterButton;
    private EditText emailInput;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        setContentView(view);
        ViewCompat.setOnApplyWindowInsetsListener(binding.main, (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        enterButton = binding.verifyButton;
        emailInput = binding.mailInput;

        enterButton.setOnClickListener(v -> requestLoginToken(emailInput.getText().toString()));
    }

    /**
     * Asks the server to send a one-time token to the given address and, once that worked,
     * continues to the screen where the token is entered.
     *
     * @param mailAddress the address the user typed
     */
    private void requestLoginToken(String mailAddress) {
        APIService apiService = RetrofitClient.getClient().create(APIService.class);

        LoginRequest request = new LoginRequest(mailAddress, "");
        Call<ServerResponse> call = apiService.requestLogin(request);
        Intent enterAuthTokenActivity = new Intent(this, EnterAuthTokenActivity.class);

        /// 'call.enqueue' executes the request to the server.
        /// 'callback' specifies how to handle the answer of the request.
        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                if (response.isSuccessful()) {
                    /// 'SharedPreferences' is used to save data (at the moment just the email)
                    /// persistently, even when the app is closed
                    LoginSession.from(LoginActivity.this).saveMailAddress(mailAddress);

                    LoginActivity.this.startActivity(enterAuthTokenActivity);
                } else {
                    Log.e(TAG, readErrorMessage(response));
                }
            }

            //Currently the response is broken, the enterAuthTokenActivity entry shouldn't be
            //here. Fix it later.
            @Override
            public void onFailure(Call<ServerResponse> call, Throwable t) {
                Log.e(TAG, t.getMessage());
                Toast.makeText(LoginActivity.this, "Connection issue.", Toast.LENGTH_SHORT).show();
            }
        });
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
