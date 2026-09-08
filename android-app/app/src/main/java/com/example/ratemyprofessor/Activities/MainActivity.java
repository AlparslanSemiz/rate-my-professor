package com.example.ratemyprofessor.Activities;

import android.os.Bundle;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.widget.FrameLayout;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.content.res.AppCompatResources;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.lifecycle.ViewModelProvider;

import com.example.liquidglass.LiquidGlassTabBar;
import com.example.liquidglass.LiquidGlassView;
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
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.databinding.ActivityMainBinding;

import java.util.Arrays;

import kotlin.Unit;

/**
 * Hosts every screen of the logged in app. The bottom navigation and the selection flow both
 * work by swapping the fragment inside this activity.
 *
 * <p>As the {@link ControlFlowInterface} implementation, this activity is the only place that
 * knows which screen follows which. The fragments themselves only report what the user picked.</p>
 */
public class MainActivity extends AppCompatActivity implements ControlFlowInterface {

    private static final int TAB_SEARCH = 0;
    private static final int TAB_HOME = 1;
    private static final int TAB_SETTINGS = 2;
    private float tabTouchDownX;
    private float tabTouchDownY;
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
     * first fills the tab bar with the icons and icon positions and then
     * Connects each bottom navigation button to the screen it opens.
     */
    private void setUpBottomNavigation() {

        binding.customBottomNav.setTabs(Arrays.asList(
                new LiquidGlassTabBar.TabItem(getString(R.string.nav_search), AppCompatResources.getDrawable(this, R.drawable.search_icon)),
                new LiquidGlassTabBar.TabItem(getString(R.string.nav_home), AppCompatResources.getDrawable(this, R.drawable.home_icon)),
                new LiquidGlassTabBar.TabItem(getString(R.string.nav_settings), AppCompatResources.getDrawable(this, R.drawable.settings_icon))

        ));
        View tabsRow = binding.customBottomNav.getChildAt(0);
        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) tabsRow.getLayoutParams();
        params.gravity = Gravity.CENTER_VERTICAL;
        tabsRow.setLayoutParams(params);



        binding.customBottomNav.setSelectedIndex(TAB_HOME);
        binding.customBottomNav.setEnableDynamicBackground(true);

        binding.customBottomNav.setOnTabSelected(index -> {
            openTopLevelTab(index);
            return Unit.INSTANCE;
        });

        //This logic here is used to calculate the position of the click.
        // it is needed to call change the fragment even the index has not changed.
        // I dont really know why it is all yellow but it works and this is fine :)
        int touchSlop = ViewConfiguration.get(this).getScaledTouchSlop();
        binding.customBottomNav.setOnTouchListener((view, event) -> {
            if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
                tabTouchDownX = event.getX();
                tabTouchDownY = event.getY();
            }

            if (event.getActionMasked() == MotionEvent.ACTION_UP) {
                boolean wasTap =
                        Math.abs(event.getX() - tabTouchDownX) < touchSlop
                                && Math.abs(event.getY() - tabTouchDownY) < touchSlop;

                if (wasTap) {


                    float tabWidth = view.getWidth() / 3f;
                    int tappedIndex = Math.min(
                            (int) (event.getX() / tabWidth),
                            TAB_SETTINGS
                    );

                    boolean sameTab =
                            tappedIndex == binding.customBottomNav.getSelectedIndex();

                    if (sameTab && !isTopLevelScreen(tappedIndex)) {
                        openTopLevelTab(tappedIndex);
                    }
                }
            }
            return false;
        });

    }
    private void openTopLevelTab(int index) {

        getSupportFragmentManager().popBackStack(
                null,
                FragmentManager.POP_BACK_STACK_INCLUSIVE
        );

        switch (index) {
            case TAB_SEARCH ->
                    loadFragment(new SearchFragment(), false);

            case TAB_HOME ->
                    loadFragment(new HomeFragment(), false);

            case TAB_SETTINGS ->
                    loadFragment(new SettingsFragment(), false);
        }
    }

    private boolean isTopLevelScreen(int index) {
        Fragment current = getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);

        return switch (index) {
            case TAB_SEARCH -> current instanceof SearchFragment;
            case TAB_HOME -> current instanceof HomeFragment;
            case TAB_SETTINGS -> current instanceof SettingsFragment;
            default -> false;
        };
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
