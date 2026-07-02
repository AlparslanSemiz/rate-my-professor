package com.example.myapplication_java.Activities;

import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.room.Room;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.Fragments.HomeFragment;
import com.example.myapplication_java.Fragments.LectureRatingsFragment;
import com.example.myapplication_java.Fragments.ProfessorProfileFragment;
import com.example.myapplication_java.Fragments.SearchFragment;
import com.example.myapplication_java.Fragments.SettingsFragment;
import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.ActivityMainBinding;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;

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

            binding.bottomNav.setVisibility(keyboardVisible ? View.GONE : View.VISIBLE);

            return insets;
        });

        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        OkHttpClient client = new OkHttpClient.Builder().addInterceptor(loggingInterceptor).build();
        APIService apiService =
                RetrofitClient
                        .getClient(client)
                        .create(APIService.class);

        loadFragment(new HomeFragment());
        Database database = Room.databaseBuilder(
                this,
                Database.class,
                Database.DB_NAME
        ).fallbackToDestructiveMigration(true).build();
        database.updateDB(apiService);

        binding.bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();

            if (itemId == R.id.nav_home) {
                // open homeFragment
                getSupportFragmentManager()
                        .beginTransaction()
                        .replace(R.id.fragment_container, new HomeFragment())
                        .commit();
                return true;

            } else if (itemId == R.id.nav_search) {
                // open searchFragment
                getSupportFragmentManager()
                        .beginTransaction()
                        .replace(R.id.fragment_container, new SearchFragment())
                        .commit();
                return true;

            } else if (itemId == R.id.nav_settings) {
                // open settingsFragment
                getSupportFragmentManager()
                        .beginTransaction()
                        .replace(R.id.fragment_container, new SettingsFragment())
                        .commit();
                return true;
            }

            return false;
        });
    }

    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();
    }

    @Override
    public void onProfessorSelected(Professor professor) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, new ProfessorProfileFragment(professor))
                .commit();
    }

    @Override
    public void onLectureSelected(String lectureTitle) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, new ProfessorProfileFragment(lectureTitle))
                .commit();
    }

    @Override
    public void openLectureProfile(Professor professor, Semester semester, Lecture lecture) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, new LectureRatingsFragment(professor, semester, lecture))
                .commit();
    }

}