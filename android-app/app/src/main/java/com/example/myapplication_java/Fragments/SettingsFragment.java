package com.example.myapplication_java.Fragments;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.viewmodel.CreationExtras;

import com.example.myapplication_java.Activities.LoginActivity;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.ServerResponse;
import com.example.myapplication_java.databinding.FragmentSettingsBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.textfield.TextInputLayout;
import com.google.android.material.textfield.TextInputEditText;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsFragment extends Fragment {

    private FragmentSettingsBinding binding;

    @NonNull
    @Override
    public CreationExtras getDefaultViewModelCreationExtras() {
        return super.getDefaultViewModelCreationExtras();
    }

    @Override
    public View onCreateView(
            LayoutInflater inflater,
            ViewGroup container,
            Bundle savedInstanceState
    ) {
        binding = FragmentSettingsBinding.inflate(inflater, container, false);
        setupBackButton();
        setupDarkModeSwitch();
        setupBugReportButton();
        setupDeleteAccountButton();
        return binding.getRoot();
    }

    private void setupBackButton() {
        binding.backButton.setOnClickListener(v -> {
            BottomNavigationView bottomNavigationView = requireActivity().findViewById(R.id.bottom_nav);
            if (bottomNavigationView != null) {
                bottomNavigationView.setSelectedItemId(R.id.nav_home);
                return;
            }

            requireActivity()
                    .getSupportFragmentManager()
                    .beginTransaction()
                    .replace(R.id.fragment_container, new HomeFragment())
                    .commit();
        });
    }

    private void setupDarkModeSwitch() {
        binding.darkModeSwitch.setChecked(true);
        binding.darkModeSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (!isChecked) {
                binding.darkModeSwitch.setChecked(true);
                Toast.makeText(requireContext(), "Light mode is not available yet.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupBugReportButton() {
        binding.bugReport.setOnClickListener(v -> showBugReportDialog());
    }

    private void setupDeleteAccountButton() {
        binding.deleteAccountButton.setOnClickListener(v -> showDeleteAccountConfirmation());
    }

    private void showBugReportDialog() {
        View dialogView = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_bug_report, null);
        TextInputLayout bugReportInputLayout = dialogView.findViewById(R.id.bug_report_input_layout);
        TextInputEditText bugReportInput = dialogView.findViewById(R.id.bug_report_input);

        androidx.appcompat.app.AlertDialog dialog = new MaterialAlertDialogBuilder(requireContext())
                .setView(dialogView)
                .create();

        dialog.show();

        Window window = dialog.getWindow();
        if (window != null) {
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        dialogView.findViewById(R.id.bug_report_close).setOnClickListener(view -> dialog.dismiss());
        dialogView.findViewById(R.id.bug_report_cancel).setOnClickListener(view -> dialog.dismiss());
        dialogView.findViewById(R.id.bug_report_submit).setOnClickListener(view -> {
            String reportText = getTextFromInput(bugReportInput);
            if (reportText.isEmpty()) {
                bugReportInputLayout.setError("Please describe the bug first.");
                return;
            }

            bugReportInputLayout.setError(null);
            Toast.makeText(requireContext(), "Bug report saved for sending.", Toast.LENGTH_LONG).show();
            dialog.dismiss();
        });
    }

    private void showDeleteAccountConfirmation() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Delete Account")
                .setMessage("This will permanently delete your account.")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Delete", (dialog, which) -> deleteAccount())
                .show();
    }

    private void deleteAccount() {
        SharedPreferences persistentEmailSave = requireActivity().getSharedPreferences("savedEmail", Context.MODE_PRIVATE);
        String mailAddress = persistentEmailSave.getString("mailAddress", "");

        if (mailAddress.isEmpty()) {
            Toast.makeText(requireContext(), "No account email found.", Toast.LENGTH_LONG).show();
            return;
        }

        APIService apiService = createApiService();
        Call<ServerResponse> call = apiService.deleteAccount(new LoginRequest(mailAddress, ""));

        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                if (!isAdded()) {
                    return;
                }

                ServerResponse serverResponse = response.body();
                if (response.isSuccessful() && serverResponse != null && serverResponse.success) {
                    persistentEmailSave.edit().clear().apply();
                    Toast.makeText(requireContext(), serverResponse.message, Toast.LENGTH_LONG).show();
                    returnToLogin();
                } else if (serverResponse != null && serverResponse.message != null) {
                    Toast.makeText(requireContext(), serverResponse.message, Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(requireContext(), "Account deletion failed.", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ServerResponse> call, Throwable t) {
                if (!isAdded()) {
                    return;
                }

                Toast.makeText(requireContext(), "Account deletion failed.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private APIService createApiService() {
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        OkHttpClient client = new OkHttpClient.Builder().addInterceptor(loggingInterceptor).build();
        return RetrofitClient
                .getClient(client)
                .create(APIService.class);
    }

    private String getTextFromInput(TextInputEditText input) {
        if (input.getText() == null) {
            return "";
        }
        return input.getText().toString().trim();
    }

    private void returnToLogin() {
        Intent loginActivity = new Intent(requireContext(), LoginActivity.class);
        loginActivity.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(loginActivity);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
