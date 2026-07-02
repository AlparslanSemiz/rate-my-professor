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
import com.example.myapplication_java.ServerCommunication.ServerResponse;
import com.example.myapplication_java.databinding.ActivityLoginBinding;


import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
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

        enterButton = binding.verifyButton;
        emailInput = binding.mailInput;
        //If you are reading this and didn't write this comment remove the following 2 lines its just there for debugging purposes.
        Intent mainActivity = new Intent(this, MainActivity.class);
        startActivity(mainActivity);
        //end of test-code

        enterButton.setOnClickListener(v -> {
            String mailAddress = emailInput.getText().toString();

            // This is for debugging purposes, observes the requests sent and logs them.
            HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
            loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
            OkHttpClient client = new OkHttpClient.Builder().addInterceptor(loggingInterceptor).build();
            APIService apiService =
                    RetrofitClient
                            .getClient(client)
                            .create(APIService.class);

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
                        SharedPreferences loginDataStorage = getSharedPreferences("loginData", MODE_PRIVATE);
                        SharedPreferences.Editor editor = loginDataStorage.edit();
                        editor.putString("mailAddress", mailAddress);
                        editor.apply();

                        LoginActivity.this.startActivity(enterAuthTokenActivity);
                    } else {
                        System.out.println(response.errorBody());
                    }
                }

                //Currently the response is broken, the enterAuthTokenActivity entry shouldn't be
                //here. Fix it later.
                @Override
                public void onFailure(Call<ServerResponse> call, Throwable t) {
                    System.out.println("Error: " + t.getMessage());
                    LoginActivity.this.startActivity(enterAuthTokenActivity);
                }
            });
        });
    }
}
