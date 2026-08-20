package com.example.myapplication_java.Fragments;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.bumptech.glide.Glide;
import com.example.myapplication_java.Activities.LoginActivity;
import com.example.myapplication_java.Activities.MainActivity;
import com.example.myapplication_java.MyApplication;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.NetworkUtils;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;
import com.example.myapplication_java.ServerCommunication.Responses.StudentProfileResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.FragmentHomeScreenBinding;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The screen the app starts on. Currently its only action is opening the notifications.
 */
public class HomeFragment extends Fragment {

    private static final String TAG = "HomeScreen";

    private static final String PROFILE_PICTURE_FILEPATH = "profile_picture.png";
    private FragmentHomeScreenBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentHomeScreenBinding.inflate(inflater, container, false);

        setStatsAndUsername(binding);

        binding.notifications.setOnClickListener(v -> openNotifications());
        return binding.getRoot();
    }

    /**
     * Display the username and stats for the user.
     * @param binding
     */
    public void setStatsAndUsername(FragmentHomeScreenBinding binding) {
        LoginSession session = LoginSession.from(requireContext());

        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<StudentProfileResponse> userInfoCall = apiService.getUserInformation(session.bearerToken());

        if (!NetworkUtils.isInternetAvailable(getContext())) {
            Toast.makeText(getContext(), "Internet not available", Toast.LENGTH_SHORT).show();
            SharedPreferences statistics = getActivity().getSharedPreferences(MyApplication.STATISTICS_STORAGE, Context.MODE_PRIVATE);

            binding.userName.setText(statistics.getString("username", ""));
            binding.averageRatingGivenNum.setText(String.valueOf(statistics.getFloat("averageRating", 0)));
            binding.professorsRatedNum.setText(String.valueOf(statistics.getInt("ratingCount", 0)));
            binding.commentsWrittenNum.setText(String.valueOf(statistics.getInt("writtencomments", 0)));
            binding.upDownvotesNum.setText(String.valueOf(statistics.getInt("credibilityScore", 0)));
            File imageFile = new File(getContext().getFilesDir(), PROFILE_PICTURE_FILEPATH);
            if (imageFile.exists()) {
                Glide.with(getContext())
                        .load(imageFile)
                        .into(binding.profilePicture);
            }
        } else {
            userInfoCall.enqueue(new Callback<>() {
                @Override
                public void onResponse(Call<StudentProfileResponse> userInfocall, Response<StudentProfileResponse> response) {
                    if (response.isSuccessful()) {
                        binding.userName.setText(response.body().username());
                        binding.averageRatingGivenNum.setText(String.valueOf(response.body().averageRating()));
                        binding.professorsRatedNum.setText(String.valueOf(response.body().ratingsCount()));
                        binding.commentsWrittenNum.setText(String.valueOf(response.body().commentsWritten()));
                        binding.upDownvotesNum.setText(String.valueOf(response.body().credibilityScore()));
                        Call<ResponseBody> imageCall = apiService.downloadImage(response.body().profilePicture().replaceFirst("svg", "png"));
                        imageCall.enqueue(new Callback<ResponseBody>() {
                            @Override
                            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                                if (response.isSuccessful() && response.body() != null) {
                                    saveImageAndSetProfilePicture(response.body(), binding.profilePicture);
                                }
                            }

                            @Override
                            public void onFailure(Call<ResponseBody> call, Throwable throwable) {
                                Log.e(TAG, "Error: " + throwable.getMessage());
                            }
                        });
                    }

                }

                @Override
                public void onFailure(Call<StudentProfileResponse> userInfocall, Throwable t) {
                    Log.e(TAG, "Error: " + t.getMessage());
                }
            });
        }
    }

    private void saveImageAndSetProfilePicture(ResponseBody body, ImageView image) {
        File imageFile = new File(getContext().getFilesDir(), PROFILE_PICTURE_FILEPATH);
        try (InputStream input = body.byteStream();
            OutputStream output = new FileOutputStream(imageFile)) {

            byte[] buffer = new byte[8192];
            int bytesRead;

            while ((bytesRead = input.read(buffer)) != -1) {
                output.write(buffer, 0, bytesRead);
            }
        } catch (IOException e) {
            Log.println(Log.ERROR, "HomeFragment", e.getMessage());
        }
        Glide.with(getContext())
                .load(imageFile)
                .into(image);
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

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
