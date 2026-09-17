package com.example.ratemyprofessor.fragments;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.bumptech.glide.Glide;
import com.example.ratemyprofessor.activities.LoginActivity;
import com.example.ratemyprofessor.RateMyProfessorApplication;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.NetworkUtils;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;
import com.example.ratemyprofessor.servercommunication.responses.StudentProfileResponse;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.FragmentHomeScreenBinding;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Locale;
import java.util.Objects;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The screen the app starts on. Currently, its only action is opening the notifications
 */
public class HomeFragment extends Fragment {

    private static final String TAG = "HomeScreen";

    private static final String PROFILE_PICTURE_FILEPATH = "profile_picture.png";
    private static final String PROFILE_PICTURE_KEY = "profilePicture";
    private FragmentHomeScreenBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentHomeScreenBinding.inflate(inflater, container, false);

        setStatsAndUsername();

        binding.notifications.setOnClickListener(v -> openNotifications());
        binding.listOfMyRatingsButton.setOnClickListener(v -> openListOfMyRatings());
        return binding.getRoot();
    }

    /**
     * Displays cached values immediately and then refreshes them in the background. A missing
     * connection therefore never leaves the home screen empty.
     */
    public void setStatsAndUsername() {
        SharedPreferences statistics = requireActivity().getSharedPreferences(
                RateMyProfessorApplication.STATISTICS_STORAGE,
                Context.MODE_PRIVATE
        );
        showProfile(
                statistics.getString("username", ""),
                statistics.getFloat("averageRating", 0),
                statistics.getInt("ratingCount", 0),
                statistics.getInt("writtencomments", 0),
                statistics.getInt("credibilityScore", 0)
        );
        showCachedProfilePicture();

        if (!AuthManager.getInstance().isLoggedIn()
                || !NetworkUtils.isInternetAvailable(requireContext())) {
            return;
        }

        refreshProfile(statistics);
    }

    private void refreshProfile(SharedPreferences statistics) {
        LoginSession session = LoginSession.from(requireContext());
        APIService apiService = RetrofitClient.getClient().create(APIService.class);

        apiService.getUserInformation(session.bearerToken()).enqueue(new Callback<>() {
            @Override
            public void onResponse(
                    @NonNull Call<StudentProfileResponse> call,
                    @NonNull Response<StudentProfileResponse> response
            ) {
                if (response.code() == 401) {
                    handleExpiredSession(session);
                    return;
                }

                StudentProfileResponse profile = response.body();
                if (!response.isSuccessful() || profile == null || binding == null) {
                    Log.e(TAG, "Profile refresh failed with status " + response.code());
                    return;
                }

                String previousPicture = statistics.getString(PROFILE_PICTURE_KEY, "");
                String currentPicture = profile.profilePicture() == null
                        ? ""
                        : profile.profilePicture();

                statistics.edit()
                        .putString("username", profile.username())
                        .putFloat("averageRating", (float) profile.averageRating())
                        .putInt("ratingCount", profile.ratingsCount())
                        .putInt("writtencomments", profile.commentsWritten())
                        .putInt("credibilityScore", profile.credibilityScore())
                        .apply();

                showProfile(
                        profile.username(),
                        profile.averageRating(),
                        profile.ratingsCount(),
                        profile.commentsWritten(),
                        profile.credibilityScore()
                );
                refreshProfilePictureIfNeeded(
                        apiService,
                        statistics,
                        previousPicture,
                        currentPicture
                );
            }

            @Override
            public void onFailure(@NonNull Call<StudentProfileResponse> call, @NonNull Throwable throwable) {
                Log.e(TAG, "Profile refresh failed", throwable);
            }
        });
    }

    private void showProfile(
            String username,
            double rating,
            int ratingCount,
            int writtenComments,
            int credibilityScore
    ) {
        if (binding == null) {
            return;
        }

        binding.userName.setText(username);
        binding.averageRatingGivenNum.setText(
                Math.abs(rating - 3.14f) < 0.01f
                        ? "π"
                        : String.format(Locale.ROOT, "%.2f", rating)
        );
        binding.professorsRatedNum.setText(String.valueOf(ratingCount));
        binding.commentsWrittenNum.setText(String.valueOf(writtenComments));
        binding.upDownvotesNum.setText(String.valueOf(credibilityScore));
    }

    private void showCachedProfilePicture() {
        File imageFile = new File(requireContext().getFilesDir(), PROFILE_PICTURE_FILEPATH);
        if (imageFile.exists() && binding != null) {
            Glide.with(this)
                    .load(imageFile)
                    .into(binding.profilePicture);
        }
    }

    private void refreshProfilePictureIfNeeded(
            APIService apiService,
            SharedPreferences statistics,
            String previousPicture,
            String currentPicture
    ) {
        File imageFile = new File(requireContext().getFilesDir(), PROFILE_PICTURE_FILEPATH);
        if (currentPicture.isEmpty()
                || (currentPicture.equals(previousPicture) && imageFile.exists())) {
            return;
        }

        apiService.downloadImage(currentPicture.replaceFirst("svg", "png"))
                .enqueue(new Callback<>() {
                    @Override
                    public void onResponse(@NonNull Call<ResponseBody> call, @NonNull Response<ResponseBody> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            if (saveImageAndSetProfilePicture(response.body())) {
                                statistics.edit()
                                        .putString(PROFILE_PICTURE_KEY, currentPicture)
                                        .apply();
                            }
                        }
                    }

                    @Override
                    public void onFailure(@NonNull Call<ResponseBody> call, @NonNull Throwable throwable) {
                        Log.e(TAG, "Profile picture refresh failed", throwable);
                    }
                });
    }

    private void handleExpiredSession(LoginSession session) {
        if (!isAdded()) {
            return;
        }

        session.clear();
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
        Toast.makeText(requireContext(), "Your session has expired.", Toast.LENGTH_SHORT).show();
        startActivity(new Intent(requireContext(), LoginActivity.class));
        requireActivity().finish();
    }

    private boolean saveImageAndSetProfilePicture(ResponseBody body) {
        if (getContext() == null || !isAdded()) {
            Log.d(TAG, "Fragment is no longer attached.");
            return false;
        }
        File imageFile = new File(getContext().getFilesDir(), PROFILE_PICTURE_FILEPATH);
        try (InputStream input = body.byteStream();
            OutputStream output = new FileOutputStream(imageFile)) {

            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = input.read(buffer)) != -1) {
                output.write(buffer, 0, bytesRead);
            }
        } catch (IOException e) {
            Log.println(Log.ERROR, "HomeFragment", Objects.requireNonNull(e.getMessage()));
            return false;
        }
        if (binding != null) {
            Glide.with(this)
                    .load(imageFile)
                    .into(binding.profilePicture);
        }
        return true;
    }

    /**
     * Opens the notification screen.
     * <p>Unlike the bottom navigation tabs this goes on the back stack, so its back button can
     * return here.</p>
     */
    private void openNotifications() {
        requireActivity().getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, new NotificationFragment())
                .addToBackStack(null)
                .commit();
    }

    /**
     * Opens the List Of My Ratings-screen.
     * <p>Unlike the bottom navigation tabs this goes on the back stack, so its back button can
     * return here.</p>
     */
    private void openListOfMyRatings() {
        requireActivity().getSupportFragmentManager()
                .beginTransaction().replace(R.id.fragment_container, new ListOfMyRatingsFragment())
                .addToBackStack(null)
                .commit();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
