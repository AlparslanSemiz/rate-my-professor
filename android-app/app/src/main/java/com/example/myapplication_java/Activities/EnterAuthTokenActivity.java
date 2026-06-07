package com.example.myapplication_java.Activities;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.ActivityEnterAuthTokenBinding;
import com.example.myapplication_java.databinding.ActivityLoginBinding;

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

        continueButton = binding.enterCode;
        tokenInput = binding.inputCode;

        continueButton.setOnClickListener(v -> {
            String token = tokenInput.getText().toString();

            APIService apiService =
                    RetrofitClient
                            .getClient()
                            .create(APIService.class);

            /// 'SharedPreferences' is used to save data (currently just the email)
            /// persistently, even when the app is closed
            SharedPreferences persistentEmailSave = getSharedPreferences("savedEmail", MODE_PRIVATE);
            String mailAddress = persistentEmailSave.getString("mailAddress", "");
            LoginRequest request = new LoginRequest(mailAddress, token);

            Call<String> call = apiService.login(request);

            Intent enterLoggedActivity = new Intent(this, LoggedActivity.class);

            call.enqueue(new Callback<String>() {
                @Override
                public void onResponse(Call<String> call, Response<String> response) {
                    if(response.body().equals("Invalid Token")) { // maybe server should return a boolean if possible lmao
                        // TODO: Text with 'wrong code' or something like that
                    } else {
                        EnterAuthTokenActivity.this.startActivity(enterLoggedActivity);
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
