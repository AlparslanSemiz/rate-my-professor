package com.example.myapplication_java.Activities;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.Fragments.HomeFragment;
import com.example.myapplication_java.Fragments.OfferingRatingsFragment;
import com.example.myapplication_java.Fragments.ProfileFragment;
import com.example.myapplication_java.Fragments.ReplyFragment;
import com.example.myapplication_java.Fragments.SearchFragment;
import com.example.myapplication_java.Fragments.SettingsFragment;
import com.example.myapplication_java.MyApplication;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.PersonalStatisticsResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.ActivityMainBinding;

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
            loadFragment(new HomeFragment());
        }

        refreshLocalData();
        setUpBottomNavigation();
    }

    /**
     * Pulls the current professors and lectures from the server into the local database, so
     * the search screen has something to work with.
     */
    private void refreshLocalData() {
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Database.getInstance(this).updateDB(apiService);
    }

    /**
     * Connects each bottom navigation button to the screen it opens.
     */
    private void setUpBottomNavigation() {
        binding.navHome.setOnClickListener(v -> loadFragment(new HomeFragment()));
        binding.navSearch.setOnClickListener(v -> loadFragment(new SearchFragment()));
        binding.navSettings.setOnClickListener(v -> loadFragment(new SettingsFragment()));
    }

    /**
     * Shows the given fragment as the current screen.
     *
     * @param fragment the screen to display
     */
    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();
    }

    private void getHomepageData() {
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        String authToken = LoginSession.from(this).bearerToken();
        Call<PersonalStatisticsResponse> call = apiService.getHomepageData(authToken);
        call.enqueue(new Callback<PersonalStatisticsResponse>() {
            @Override
            public void onResponse(Call<PersonalStatisticsResponse> call, Response<PersonalStatisticsResponse> response) {
                if (response.isSuccessful()) {
                    PersonalStatisticsResponse statisticsResponse = response.body();
                    SharedPreferences statistics = getSharedPreferences(MyApplication.STATISTICS_STORAGE, Context.MODE_PRIVATE);
                    statistics.edit().putString("username", statisticsResponse.username())
                    .putString("profilePicture", statisticsResponse.profilePicture())
                    .putFloat("averageRating", statisticsResponse.averageRating())
                    .putInt("ratingCount", statisticsResponse.ratingCount())
                    .putInt("writtencomments", statisticsResponse.writtencomments())
                    .putInt("credibilityScore", statisticsResponse.credibilityScore()).apply();
                } else {
                    Log.println(Log.ERROR, "HomePage", "couldn't get the homepage data.");
                }
            }

            @Override
            public void onFailure(Call<PersonalStatisticsResponse> call, Throwable throwable) {
                Log.println(Log.ERROR, "HomePage", "couldn't get the homepage data.");
            }
        });
    }
    @Override
    public void openHome() {
        loadFragment(new HomeFragment());
    }

    @Override
    public void onProfessorSelected(Professor professor) {
        loadFragment(new ProfileFragment(professor));
    }

    @Override
    public void onLectureSelected(String lectureTitle) {
        loadFragment(new ProfileFragment(lectureTitle));
    }

    @Override
    public void openLectureProfile(Professor professor, Semester semester, Lecture lecture) {
        loadFragment(new OfferingRatingsFragment(professor, semester, lecture));
    }

    @Override
    public void openReplyFragment(Comment comment) {
        loadFragment(new ReplyFragment(comment));
    }

}
