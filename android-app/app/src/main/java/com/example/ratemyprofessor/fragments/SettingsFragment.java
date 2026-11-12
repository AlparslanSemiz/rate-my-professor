package com.example.ratemyprofessor.fragments;

import android.R.layout;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

import com.example.ratemyprofessor.activities.LoginActivity;
import com.example.ratemyprofessor.domain.BugSeverity;
import com.example.ratemyprofessor.RateMyProfessorApplication;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.LoginSession;

import com.example.ratemyprofessor.servercommunication.requests.BugReportRequest;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.DialogBugReportBinding;
import com.example.ratemyprofessor.databinding.FragmentSettingsBinding;
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

    private APIService apiService;

    /**
     * Inflates the settings layout and prepares the click actions.
     *
     * @param inflater the inflater used to create the fragment view
     * @param container the parent container, or null if the view has no parent
     * @param savedInstanceState the saved fragment state, or null on first creation
     * @return the root view of the settings fragment
     */
    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentSettingsBinding.inflate(inflater, container, false);
        apiService = RetrofitClient.getClient().create(APIService.class);
        applyStatusBarInset();
        setUpClickListeners();
        return binding.getRoot();
    }

    /**
     * Keeps the top of the screen out from under the status bar.
     *
     * <p>The app draws edge to edge, so the height of the status bar is only known at runtime
     * and a fixed margin in the layout would either waste space or hide the back button,
     * depending on the device.</p>
     */
    private void applyStatusBarInset() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.settingsRoot, (view, windowInsets) -> {
            Insets systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(view.getPaddingLeft(), systemBars.top, view.getPaddingRight(), 0);
            return windowInsets;
        });
    }

    /**
     * Connects each settings UI element to its behavior.
     */
    private void setUpClickListeners() {
        binding.darkModeSwitch.setChecked(isNightModeEnabled());

        binding.darkModeSwitch.setOnCheckedChangeListener((buttonView, isChecked) ->
                setNightMode(isChecked)
        );
        if (!AuthManager.getInstance().isLoggedIn()) {
            binding.logoutAllDevicesButton.setVisibility(View.GONE);
            binding.loginButton.setVisibility(View.VISIBLE);
        }
        // The whole row is the target users aim at, not just the switch at its far end.
        binding.darkModeRow.setOnClickListener(v -> binding.darkModeSwitch.toggle());
        binding.bugReport.setOnClickListener(v -> showBugReportDialog());
        binding.logoutAllDevicesButton.setOnClickListener(v -> confirmLogoutOnAllDevices());
        binding.deleteAccountButton.setOnClickListener(v -> confirmAccountDeletion());
        binding.loginButton.setOnClickListener(v -> openLoginScreen());
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
     * <p>Saving is what {@link RateMyProfessorApplication} reads on startup, applying is what changes the
     * currently visible screens.</p>
     *
     * @param isEnabled whether dark mode should be on
     */
    private void setNightMode(boolean isEnabled) {
        // Restoring the saved view state re-applies the checked state after the listener is
        // attached, so this can be called with the mode that is already active. Applying it
        // again would recreate every activity for nothing.
        if (isEnabled == isNightModeEnabled()) {
            return;
        }

        requireActivity()
                .getSharedPreferences(RateMyProfessorApplication.SETTINGS_STORAGE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(RateMyProfessorApplication.DARK_MODE_KEY, isEnabled)
                .apply();

        int nightMode = isEnabled
                ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO;
        AppCompatDelegate.setDefaultNightMode(nightMode);
    }

    /**
     * Opens the bug report dialog.
     */
    private void showBugReportDialog() {
        DialogBugReportBinding dialogBinding = DialogBugReportBinding.inflate(getLayoutInflater());

        BugSeverity[] severityLevels = BugSeverity.values();

        ArrayAdapter<BugSeverity> adapter = new ArrayAdapter<>(
                requireContext(),
                layout.simple_spinner_item,
                severityLevels
        );

        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);

        Dialog dialog = new MaterialAlertDialogBuilder(requireContext())
                .setView(dialogBinding.getRoot())
                .create();

        dialogBinding.bugSeverity.setAdapter(adapter);
        dialogBinding.bugReportCancel.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportSubmit.setOnClickListener(v -> submitBugReport(dialogBinding, dialog));
        dialogBinding.bugReportTitleInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void afterTextChanged(Editable s) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                dialogBinding.bugReportTitleInput.setError(null);
            }
        });
        dialogBinding.bugReportInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            /**
             * Clears the empty-input error once the user starts typing.
             *
             * @param s the updated editable text
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
     * Validates and submits the bug report text before closing the dialog.
     *
     * @param dialogBinding the views of the bug report dialog
     * @param dialog        the dialog to close once the report is accepted
     */
    private void submitBugReport(DialogBugReportBinding dialogBinding, Dialog dialog) {
        String title = dialogBinding.bugReportTitleInput.getText() == null
                ? ""
                : dialogBinding.bugReportTitleInput.getText().toString().trim();

        String report = dialogBinding.bugReportInput.getText() == null
                ? ""
                : dialogBinding.bugReportInput.getText().toString().trim();

        BugSeverity severity = (BugSeverity) dialogBinding.bugSeverity.getSelectedItem();

        BugReportRequest request = new BugReportRequest(title, report, severity);
        String token = LoginSession.from(requireContext()).bearerToken();

        Call<BasicResponse> reportCall = apiService.reportBug(token, request);

        if (title.isEmpty()) {
            dialogBinding.bugReportTitleInput.setError(getString(R.string.bug_report_empty_title_error));
            return;
        }
        if (report.isEmpty()) {
            dialogBinding.bugReportInputLayout.setError(getString(R.string.bug_report_empty_error));
            return;
        }

        reportCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<BasicResponse> call, @NonNull Response<BasicResponse> response) {
                BasicResponse body = response.body();
                if (!response.isSuccessful() || body == null || !body.success()) {
                    Log.println(Log.DEBUG, "bug report", "failure: " + response.code());
                    Toast.makeText(requireContext(), "Something went wrong", Toast.LENGTH_SHORT).show();
                    return;
                }
                Toast.makeText(requireContext(), R.string.bug_report_submitted, Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(@NonNull Call<BasicResponse> call, @NonNull Throwable throwable) {
                Log.println(Log.DEBUG, "comment report", "failure: " + throwable.getMessage());
            }
        });

        dialogBinding.bugReportInputLayout.setError(null);
        dialog.dismiss();
    }

    /**
     * Shows a confirmation dialog before logging out on all devices.
     */
    private void confirmLogoutOnAllDevices() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.logout_all_devices_title)
                .setMessage(R.string.logout_all_devices_message)
                .setNegativeButton(R.string.cancel, null)
                .setPositiveButton(R.string.logout_all_devices_confirm, (dialog, which) -> logoutOnAllDevices())
                .show();
    }

    /**
     * Asks the backend to revoke every auth token of the account and returns to the login screen.
     *
     * <p>Only the server can log the other devices out, because their tokens live on those
     * devices. That is why the local login data is kept until the server confirms the revocation:
     * clearing it after a failed call would log this device out while the other devices stay
     * logged in, and the user would believe the opposite.</p>
     */
    private void logoutOnAllDevices() {
        LoginSession session = LoginSession.from(requireContext());

        if (!session.isLoggedIn()) {
            Toast.makeText(requireContext(), R.string.logout_all_devices_missing_login, Toast.LENGTH_LONG).show();
            return;
        }

        // The backend identifies the account through the auth token in the header.
        APIService apiService = createApiService();
        Call<BasicResponse> call = apiService.logoutAllDevices(session.bearerToken());

        if (!NetworkUtils.isInternetAvailable(requireContext())) {
            Toast.makeText(getContext(), "Internet not available", Toast.LENGTH_SHORT).show();
        } else {
            call.enqueue(new Callback<>() {
                /**
                 * Handles the logout response from the backend.
                 *
                 * @param call the request that completed
                 * @param response the HTTP response returned by the server
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
                        Toast.makeText(requireContext(), R.string.logout_all_devices_failed, Toast.LENGTH_LONG).show();
                        return;
                    }

                    session.clear();
                    Toast.makeText(requireContext(), R.string.logout_all_devices_success, Toast.LENGTH_LONG).show();
                    openLoginScreen();
                }

                /**
                 * Handles network failures while logging out on all devices.
                 *
                 * @param call the request that completed
                 * @param throwable the cause of the request failure
                 */
                @Override
                public void onFailure(@NonNull Call<BasicResponse> call, @NonNull Throwable throwable) {
                    if (!isAdded()) {
                        return;
                    }

                    Toast.makeText(requireContext(), R.string.logout_all_devices_failed, Toast.LENGTH_LONG).show();
                }
            });
        }
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

        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
        } else {
            call.enqueue(new Callback<>() {
                /**
                 * Handles the delete-account response from the backend.
                 *
                 * @param call the request that completed
                 * @param response the HTTP response returned by the server
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
                 *
                 * @param call the request that completed
                 * @param throwable the cause of the request failure
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
        loginActivity.putExtra("skip_login", false);
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
