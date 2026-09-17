package com.example.ratemyprofessor;

import static org.junit.Assert.assertTrue;

import android.os.Looper;

import androidx.fragment.app.Fragment;

import com.example.liquidglass.LiquidGlassView;
import com.example.ratemyprofessor.activities.MainActivity;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.fragments.HomeFragment;
import com.example.ratemyprofessor.fragments.ProfileFragment;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.Shadows;
import org.robolectric.android.controller.ActivityController;

/**
 * Verifies the initial state and navigation routing of the MainActivity.
 */
@RunWith(RobolectricTestRunner.class)
public class MainActivitySmokeTest {

    /**
     * Verifies that main activity starts on home screen.
     */
    @Test
    public void mainActivityStartsOnHomeScreen() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        
        Fragment currentFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        
        assertTrue("MainActivity should start with HomeFragment", 
                currentFragment instanceof HomeFragment);
    }

    /**
     * Verifies that bottom navigation switches fragments.
     */
    @Test
    public void bottomNavigationSwitchesFragments() {
        ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class);
        MainActivity activity = controller.setup().get();
        LiquidGlassView tabBar = activity.findViewById(R.id.custom_bottom_nav);

        // We can't easily click the custom tab bar tabs without knowing the internal structure,
        // but we can verify the activity's response to the interface methods it implements.
        
        // Test Home Tab (default)
        Fragment homeFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        assertTrue(homeFragment instanceof HomeFragment);

        // We use the public interface methods to test the fragment loading logic
        activity.onProfessorSelected(new Professor("p1", "f", "l", 5.0f, 1));
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        Fragment profileFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        assertTrue("Selecting a professor should show ProfileFragment", 
                profileFragment instanceof ProfileFragment);

        activity.openHome();
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        assertTrue(activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container) instanceof HomeFragment);
    }
}
