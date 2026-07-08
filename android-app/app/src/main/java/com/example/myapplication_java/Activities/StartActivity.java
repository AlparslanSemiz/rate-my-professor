package com.example.myapplication_java.Activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * This Activity is the entry point of the program. We check whether the user is already logged in,
 * and then forward the program towards either Login- or MainActivity accordingly.
 */
public class StartActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent mainActivityEntry = new Intent(this, MainActivity.class);
        Intent loginActivityEntry = new Intent(this, LoginActivity.class);


        SharedPreferences userLoginStorage = getSharedPreferences("loginData", MODE_PRIVATE);
        String mail = userLoginStorage.getString("mailAddress", "");
        String otp = userLoginStorage.getString("OTP", "");

        //debug
        System.out.println("mail: " + mail);
        System.out.println("otp: " + otp);
        for (int i = 0; i < 10; i++) {
            System.out.println(".");
        }

        if (mail.isEmpty() || otp.isEmpty()) {
            startActivity(loginActivityEntry);
            finish(); // StartActivity can be closed, as it will be not accessed again
            return;
        }

        LoginRequest request = new LoginRequest(mail, otp);

        // Following 3 lines for debugging purposes, observes the requests sent and logs them.
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        OkHttpClient client = new OkHttpClient.Builder().addInterceptor(loggingInterceptor).build();
        APIService apiService = RetrofitClient.getClient(client).create(APIService.class);

        Call<ServerResponse> call = apiService.login(request);

        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                if(response.isSuccessful()) {
                    startActivity(mainActivityEntry);
                    finish();
                } else {
                    startActivity(loginActivityEntry);
                    finish();
                }

            }

            @Override
            public void onFailure(Call<ServerResponse> call, Throwable t) {
                System.out.println("Error: " + t.getMessage());
                startActivity(loginActivityEntry);
                finish();
            }
        });
    }
}
