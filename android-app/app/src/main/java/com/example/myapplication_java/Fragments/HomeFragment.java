package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.myapplication_java.Activities.LoginActivity;
import com.example.myapplication_java.Activities.MainActivity;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;
import com.example.myapplication_java.ServerCommunication.Responses.StudentProfileResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.FragmentHomeScreenBinding;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The screen the app starts on. Currently its only action is opening the notifications.
 */
public class HomeFragment extends Fragment {

    private static final String TAG = "HomeScreen";

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
        binding.listOfMyRatingsButton.setOnClickListener(v -> openListOfMyRatings());
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

        userInfoCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<StudentProfileResponse> userInfocall, Response<StudentProfileResponse> response) {
                if (response.isSuccessful()) {
                    binding.userName.setText(response.body().username());
                    binding.averageRatingGivenNum.setText(String.valueOf(response.body().averageRating()));
                    binding.professorsRatedNum.setText(String.valueOf(response.body().ratingsCount()));
                    binding.commentsWrittenNum.setText(String.valueOf(response.body().commentsWritten()));
                    binding.upDownvotesNum.setText(String.valueOf(response.body().credibilityScore()));
                }

            }

            @Override
            public void onFailure(Call<StudentProfileResponse> userInfocall, Throwable t) {
                Log.e(TAG, "Error: " + t.getMessage());
            }
        });
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
