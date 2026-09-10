package com.example.ratemyprofessor.Activities;

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.os.Bundle;
import android.view.View;
import android.view.animation.DecelerateInterpolator;

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
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.Fragments.HomeFragment;
import com.example.ratemyprofessor.Fragments.RatingsFragment;
import com.example.ratemyprofessor.Fragments.ProfileFragment;
import com.example.ratemyprofessor.Fragments.ReplyFragment;
import com.example.ratemyprofessor.Fragments.SearchFragment;
import com.example.ratemyprofessor.Fragments.SettingsFragment;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.databinding.ActivityMainBinding;


/**
 * Hosts every screen of the logged in app. The bottom navigation and the selection flow both
 * work by swapping the fragment inside this activity.
 *
 * <p>As the {@link ControlFlowInterface} implementation, this activity is the only place that
 * knows which screen follows which. The fragments themselves only report what the user picked.</p>
 */
public class MainActivity extends AppCompatActivity implements ControlFlowInterface {

    private AnimatorSet indicatorAnimator;
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

        new ViewModelProvider(this).get(MainViewModel.class);
        setUpBottomNavigation();
    }


    /**
     * Connects each bottom navigation button to the screen it opens.
     */
    private void setUpBottomNavigation() {

        binding.navHome.setOnClickListener(v -> {
            moveIndicatorTo(binding.navHome);
            loadFragment(new HomeFragment(), false);
        });
        binding.navSearch.setOnClickListener(v -> {
            moveIndicatorTo(binding.navSearch);
            loadFragment(new SearchFragment(), false);
        });
        binding.navSettings.setOnClickListener(v -> {
            moveIndicatorTo(binding.navSettings);
            loadFragment(new SettingsFragment(), false);
        });

    }

    /**
     * This is used to make the animations of the menu bar indicator when switching between home, search and settings
     *
     * @param tab
     */
    private void moveIndicatorTo(View tab) {
        float tabCenterX = tab.getLeft() + tab.getWidth() / 2f;
        float navigationCenterX = binding.customBottomNav.getWidth() / 2f;

        float targetX = tabCenterX - navigationCenterX;


        if (indicatorAnimator != null) {
            indicatorAnimator.cancel();
        }

        binding.navIndicator.setScaleX(1f);
        binding.navIndicator.setScaleY(1f);

        ObjectAnimator movement = ObjectAnimator.ofFloat(
                binding.navIndicator,
                View.TRANSLATION_X,
                binding.navIndicator.getTranslationX(),
                targetX
        );

        ObjectAnimator stretch = ObjectAnimator.ofFloat(
                binding.navIndicator,
                View.SCALE_X,
                1f, 1.18f, 1f
        );

        ObjectAnimator squash = ObjectAnimator.ofFloat(
                binding.navIndicator,
                View.SCALE_Y,
                1f, 0.88f, 1f
        );

        indicatorAnimator = new AnimatorSet();
        indicatorAnimator.playTogether(movement, stretch, squash);
        indicatorAnimator.setDuration(280);
        indicatorAnimator.setInterpolator(new DecelerateInterpolator());
        indicatorAnimator.start();
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
