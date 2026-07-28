package com.example.myapplication_java.Fragments;

import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;

import com.example.myapplication_java.Activities.LoginActivity;
import com.example.myapplication_java.MyApplication;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.BasicResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.DialogBugReportBinding;
import com.example.myapplication_java.databinding.FragmentSettingsBinding;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * A fragment that provides settings options for the user, including dark mode toggle,
 * bug reporting, and account deletion.
 */
public class SettingsFragment extends Fragment {

    private FragmentSettingsBinding binding;

    /**
     * Inflates the settings layout and prepares the click actions.
     */
    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentSettingsBinding.inflate(inflater, container, false);
        setUpClickListeners();
        return binding.getRoot();
    }

    /**
     * Connects each settings UI element to its behavior.
     */
    private void setUpClickListeners() {
        binding.darkModeSwitch.setChecked(isNightModeEnabled());

        binding.backButton.setOnClickListener(v -> navigateToHome());
        binding.darkModeSwitch.setOnCheckedChangeListener((buttonView, isChecked) ->
                setNightMode(isChecked)
        );
        binding.bugReport.setOnClickListener(v -> showBugReportDialog());
        binding.deleteAccountButton.setOnClickListener(v -> confirmAccountDeletion());
    }

    /**
     * Returns true when the app is currently displayed in dark mode.
     *
     * <p>The app-wide choice wins. Only when the user never made one, and the app therefore
     * follows the system, the current configuration decides.</p>
     */
    private boolean isNightModeEnabled() {
        int defaultNightMode = AppCompatDelegate.getDefaultNightMode();
        if (defaultNightMode == AppCompatDelegate.MODE_NIGHT_YES) {
            return true;
        }
        if (defaultNightMode == AppCompatDelegate.MODE_NIGHT_NO) {
            return false;
        }

        int currentNightMode = getResources().getConfiguration().uiMode
                & Configuration.UI_MODE_NIGHT_MASK;
        return currentNightMode == Configuration.UI_MODE_NIGHT_YES;
    }

    /**
     * Applies the selected theme mode to the app and saves it for the next start.
     *
     * <p>Saving is what {@link MyApplication} reads on startup, applying is what changes the
     * currently visible screens.</p>
     *
     * @param isEnabled whether dark mode should be on
     */
    private void setNightMode(boolean isEnabled) {
        requireActivity()
                .getSharedPreferences(MyApplication.SETTINGS_STORAGE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(MyApplication.DARK_MODE_KEY, isEnabled)
                .apply();

        int nightMode = isEnabled
                ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO;
        AppCompatDelegate.setDefaultNightMode(nightMode);
    }

    /**
     * Navigates back to the home tab from settings.
     *
     * <p>Going through the bottom navigation keeps the selected tab in sync. Only when this
     * fragment is shown without that bar, the normal back navigation is used instead.</p>
     */
    private void navigateToHome() {
        BottomNavigationView bottomNavigationView = requireActivity().findViewById(R.id.custom_bottom_nav);
        if (bottomNavigationView != null) {
            bottomNavigationView.setSelectedItemId(R.id.nav_home);
            return;
        }

        requireActivity().getOnBackPressedDispatcher().onBackPressed();
    }

    /**
     * Opens the bug report dialog.
     */
    private void showBugReportDialog() {
        DialogBugReportBinding dialogBinding = DialogBugReportBinding.inflate(getLayoutInflater());

        Dialog dialog = new MaterialAlertDialogBuilder(requireContext())
                .setView(dialogBinding.getRoot())
                .create();

        dialogBinding.bugReportClose.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportCancel.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportSubmit.setOnClickListener(v -> submitBugReport(dialogBinding, dialog));
        dialogBinding.bugReportInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            /**
             * Clears the empty-input error once the user starts typing.
             */
            @Override
            public void afterTextChanged(Editable s) {
                dialogBinding.bugReportInputLayout.setError(null);
            }
        });

        dialog.setOnShowListener(dialogInterface -> {
            if (dialog.getWindow() != null) {
                dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            }
        });
        dialog.show();
    }

    /**
     * Validates the bug report text before closing the dialog.
     *
     * @param dialogBinding the views of the bug report dialog
     * @param dialog        the dialog to close once the report is accepted
     */
    private void submitBugReport(DialogBugReportBinding dialogBinding, Dialog dialog) {
        String report = dialogBinding.bugReportInput.getText() == null
                ? ""
                : dialogBinding.bugReportInput.getText().toString().trim();

        // There is no bug-report endpoint yet, so this only validates local input.
        if (report.isEmpty()) {
            dialogBinding.bugReportInputLayout.setError(getString(R.string.bug_report_empty_error));
            return;
        }

        dialogBinding.bugReportInputLayout.setError(null);
        Toast.makeText(requireContext(), R.string.bug_report_submitted, Toast.LENGTH_SHORT).show();
        dialog.dismiss();
    }

    /**
     * Shows a confirmation dialog before deleting the account.
     */
    private void confirmAccountDeletion() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.delete_account_title)
                .setMessage(R.string.delete_account_message)
                .setNegativeButton(R.string.cancel, null)
                .setPositiveButton(R.string.delete, (dialog, which) -> deleteAccount())
                .show();
    }

    /**
     * Calls the backend to delete the current user account.
     */
    private void deleteAccount() {
        LoginSession session = LoginSession.from(requireContext());

        if (!session.isLoggedIn()) {
            Toast.makeText(requireContext(), R.string.delete_account_missing_login, Toast.LENGTH_LONG).show();
            return;
        }

        // The backend identifies the account through the auth token in the header.
        APIService apiService = createApiService();
        Call<BasicResponse> call = apiService.deleteAccount(session.bearerToken());

        call.enqueue(new Callback<>() {
            /**
             * Handles the delete-account response from the backend.
             */
            @Override
            public void onResponse(@NonNull Call<BasicResponse> call, @NonNull Response<BasicResponse> response) {
                // The answer can arrive after the user left the settings screen, in which case
                // there is no context left to show a toast with.
                if (!isAdded()) {
                    return;
                }

                BasicResponse responseBody = response.body();
                if (!response.isSuccessful() || responseBody == null || !responseBody.success()) {
                    Toast.makeText(requireContext(), R.string.delete_account_failed, Toast.LENGTH_LONG).show();
                    return;
                }

                session.clear();
                Toast.makeText(requireContext(), R.string.delete_account_success, Toast.LENGTH_LONG).show();
                openLoginScreen();
            }

            /**
             * Handles network failures during account deletion.
             */
            @Override
            public void onFailure(@NonNull Call<BasicResponse> call, @NonNull Throwable throwable) {
                if (!isAdded()) {
                    return;
                }

                Toast.makeText(requireContext(), R.string.delete_account_failed, Toast.LENGTH_LONG).show();
            }
        });
    }

    /**
     * Builds the API service used by settings actions.
     *
     * <p>Kept as its own method so the settings actions have a single place to get the service
     * from.</p>
     *
     * @return the service talking to the backend
     */
    private APIService createApiService() {
        return RetrofitClient.getClient().create(APIService.class);
    }

    /**
     * Opens the login screen as the new root screen.
     */
    private void openLoginScreen() {
        Intent loginActivity = new Intent(requireContext(), LoginActivity.class);
        loginActivity.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(loginActivity);
    }

    /**
     * Clears the binding when the fragment view is destroyed.
     */
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
