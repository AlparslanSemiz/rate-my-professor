package com.example.myapplication_java.Activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;
import com.example.myapplication_java.databinding.ActivityEnterAuthTokenBinding;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EnterAuthTokenActivity extends AppCompatActivity {
    private Button continueButton;
    private EditText tokenInput;
    private ActivityEnterAuthTokenBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        binding = ActivityEnterAuthTokenBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        setContentView(view);

        continueButton = binding.enterButton;
        tokenInput = binding.codeInput;

        continueButton.setOnClickListener(v -> {
            String token = tokenInput.getText().toString();

            APIService apiService = RetrofitClient.getClient().create(APIService.class);

            /// 'SharedPreferences' is used to save data (currently just the email)
            /// persistently, even when the app is closed
            SharedPreferences loginDataStorage = getSharedPreferences("loginData", MODE_PRIVATE);
            String mailAddress = loginDataStorage.getString("mailAddress", "");
            LoginRequest request = new LoginRequest(mailAddress, token);

            Call<ServerResponse> call = apiService.login(request);

            Intent mainActivity = new Intent(this, MainActivity.class);

            call.enqueue(new Callback<>() {
                @Override
                public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                    if(!response.body().success()) {
                        Log.println(Log.DEBUG, "login response ___", "failure");
                        Toast.makeText(EnterAuthTokenActivity.this, response.body().message(), Toast.LENGTH_LONG).show();
                    } else {
                        Log.println(Log.DEBUG, "login response ___", "success!!");

                        // Saving the OneTimePassword for future logins
                        SharedPreferences.Editor editor = loginDataStorage.edit();
                        editor.putString("OTP", token);
                        editor.putString("authToken", response.body().authToken());
                        editor.apply();
                        EnterAuthTokenActivity.this.startActivity(mainActivity);
                    }

                }

                @Override
                public void onFailure(Call<ServerResponse> call, Throwable t) {
                    Log.println(Log.DEBUG, "FAILURE", "failed!");

                }
            });
        });

    }
}
