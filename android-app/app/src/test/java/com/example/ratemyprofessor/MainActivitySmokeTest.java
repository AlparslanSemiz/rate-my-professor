package com.example.ratemyprofessor;

import static org.junit.Assert.assertTrue;

import android.os.Looper;

import androidx.fragment.app.Fragment;

import com.example.ratemyprofessor.Activities.MainActivity;
import com.example.ratemyprofessor.Fragments.HomeFragment;
import com.example.ratemyprofessor.Fragments.SearchFragment;
import com.example.ratemyprofessor.Fragments.SettingsFragment;

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

    @Test
    public void mainActivityStartsOnHomeScreen() {
        MainActivity activity = Robolectric.buildActivity(MainActivity.class).setup().get();
        
        Fragment currentFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        
        assertTrue("MainActivity should start with HomeFragment", 
                currentFragment instanceof HomeFragment);
    }

    @Test
    public void bottomNavigationSwitchesFragments() {
        ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class);
        MainActivity activity = controller.setup().get();

        // Test Search Tab
        activity.findViewById(R.id.nav_search).performClick();
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        
        Fragment searchFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        assertTrue("Clicking search nav should show SearchFragment", 
                searchFragment instanceof SearchFragment);

        // Test Settings Tab
        activity.findViewById(R.id.nav_settings).performClick();
        Shadows.shadowOf(Looper.getMainLooper()).idle();
        
        Fragment settingsFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        assertTrue("Clicking settings nav should show SettingsFragment", 
                settingsFragment instanceof SettingsFragment);

        // Test Home Tab back
        activity.findViewById(R.id.nav_home).performClick();
        Shadows.shadowOf(Looper.getMainLooper()).idle();

        Fragment homeFragment = activity.getSupportFragmentManager()
                .findFragmentById(R.id.fragment_container);
        assertTrue("Clicking home nav should show HomeFragment", 
                homeFragment instanceof HomeFragment);
    }
}
