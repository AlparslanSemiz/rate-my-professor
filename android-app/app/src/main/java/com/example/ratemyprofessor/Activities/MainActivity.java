package com.example.ratemyprofessor.Activities;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.example.ratemyprofessor.Adapters.ControlFlowInterface;
import com.example.ratemyprofessor.Adapters.MainViewModel;
import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.Lecture;
import com.example.ratemyprofessor.DomainModel.Professor;
import com.example.ratemyprofessor.DomainModel.Semester;
import com.example.ratemyprofessor.Fragments.HomeFragment;
import com.example.ratemyprofessor.Fragments.RatingsFragment;
import com.example.ratemyprofessor.Fragments.ProfileFragment;
import com.example.ratemyprofessor.Fragments.ReplyFragment;
import com.example.ratemyprofessor.Fragments.SearchFragment;
import com.example.ratemyprofessor.Fragments.SettingsFragment;
import com.example.ratemyprofessor.RateMyProfessorApplication;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.LoginSession;
import com.example.ratemyprofessor.ServerCommunication.Responses.StudentProfileResponse;
import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.ActivityMainBinding;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Hosts every screen of the logged in app. The bottom navigation and the selection flow both
 * work by swapping the fragment inside this activity.
 *
 * <p>As the {@link ControlFlowInterface} implementation, this activity is the only place that
 * knows which screen follows which. The fragments themselves only report what the user picked.</p>
 */
public class MainActivity extends AppCompatActivity implements ControlFlowInterface {

    private ActivityMainBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        View root = binding.getRoot();
        //This should hide the menu bar when the keyboard is visible
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

            binding.customBottomNav.setVisibility(keyboardVisible ? View.GONE : View.VISIBLE);

            return insets;
        });

        // On recreation (e.g. after a dark mode change) the fragment manager restores
        // the previous fragment, so only load the home screen on a fresh start.
        if (savedInstanceState == null) {
            loadFragment(new HomeFragment(), false);
        }

        MainViewModel viewModel = new ViewModelProvider(this).get(MainViewModel.class);
        setUpBottomNavigation();
        getHomepageData();
    }


    /**
     * Connects each bottom navigation button to the screen it opens.
     */
    private void setUpBottomNavigation() {
        binding.navHome.setOnClickListener(v -> loadFragment(new HomeFragment(), false));
        binding.navSearch.setOnClickListener(v -> loadFragment(new SearchFragment(), false));
        binding.navSettings.setOnClickListener(v -> loadFragment(new SettingsFragment(), false));
    }

    /**
     * Shows the given fragment as the current screen.
     *
     * @param fragment the screen to display
     * @param keepInStack if the previous fragment should be remembered so that it
     *                    can be accessed with the back button.
     */
    private void loadFragment(Fragment fragment, boolean keepInStack) {
        if (!keepInStack) {
            getSupportFragmentManager()
                    .beginTransaction()
                    .replace(R.id.fragment_container, fragment)
                    .commit();
        } else {
            getSupportFragmentManager()
                    .beginTransaction()
                    .replace(R.id.fragment_container, fragment)
                    .addToBackStack(null)
                    .commit();
        }
    }

    private void getHomepageData() {
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        String authToken = LoginSession.from(this).bearerToken();
        Call<StudentProfileResponse> call = apiService.getUserInformation(authToken);
        if (AuthManager.getInstance().isLoggedIn()){
            call.enqueue(new Callback<StudentProfileResponse>() {
                @Override
                public void onResponse(Call<StudentProfileResponse> call, Response<StudentProfileResponse> response) {
                    if (response.isSuccessful()) {
                        StudentProfileResponse statisticsResponse = response.body();
                        Log.println(Log.DEBUG, "MainActivity", statisticsResponse.toString());
                        SharedPreferences statistics = getSharedPreferences(RateMyProfessorApplication.STATISTICS_STORAGE, Context.MODE_PRIVATE);
                        statistics.edit().putString("username", statisticsResponse.username())
                                .putString("profilePicture", statisticsResponse.profilePicture())
                                .putFloat("averageRating", (float)statisticsResponse.averageRating())
                                .putInt("ratingCount", statisticsResponse.ratingsCount())
                                .putInt("writtencomments", statisticsResponse.commentsWritten())
                                .putInt("credibilityScore", statisticsResponse.credibilityScore()).apply();
                    } else {
                        Log.println(Log.ERROR, "HomePage", "couldn't get the homepage data.");
                    }
                }

                @Override
                public void onFailure(Call<StudentProfileResponse> call, Throwable throwable) {
                    Log.println(Log.ERROR, "HomePage", "couldn't get the homepage data.");
                }
            });
        }
    }
    @Override
    public void openHome() {
        loadFragment(new HomeFragment(), false);
    }

    @Override
    public void onProfessorSelected(Professor professor) {
        loadFragment(new ProfileFragment(professor), true);
    }

    @Override
    public void onLectureSelected(String lectureTitle) {
        loadFragment(new ProfileFragment(lectureTitle),  true);
    }

    @Override
    public void openLectureProfile(Professor professor, Semester semester, Lecture lecture) {
        loadFragment(new RatingsFragment(professor, semester, lecture), true);
    }

    @Override
    public void openReplyFragment(Comment comment) {
        loadFragment(new ReplyFragment(comment), true);
    }

}
