package com.example.myapplication_java.Activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.ActivityLoginBinding;


import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;


public class LoginActivity extends AppCompatActivity {
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
        enterButton = binding.enter;
        emailInput = binding.inputEmail;
        enterButton.setOnClickListener(v -> {
            String mailAddress = emailInput.getText().toString();

            APIService apiService =
                    RetrofitClient
                            .getClient()
                            .create(APIService.class);

            LoginRequest request = new LoginRequest(mailAddress, "");

            Call<String> call = apiService.requestLogin(request);

            Intent enterAuthTokenActivity = new Intent(this, EnterAuthTokenActivity.class);

            /// 'call.enqueue' executes the request to the server.
            /// 'callback' specifies how to handle the answer of the request.
            call.enqueue(new Callback<>() {
                @Override
                public void onResponse(Call<String> call, Response<String> response) {
                    if (response.isSuccessful()) {
                        /// 'SharedPreferences' is used to save data (at the moment just the email)
                        /// persistently, even when the app is closed
                        SharedPreferences persistentEmailSave = getSharedPreferences("savedEmail", MODE_PRIVATE);
                        SharedPreferences.Editor editor = persistentEmailSave.edit();
                        editor.putString("mailAddress", mailAddress);
                        editor.apply();

                        LoginActivity.this.startActivity(enterAuthTokenActivity);
                    } else {
                        System.out.println(response.errorBody());
                    }
                }

                @Override
                public void onFailure(Call<String> call, Throwable t) {
                    System.out.println("Error: " + t.getMessage());
                }
            });
        });
    }
}