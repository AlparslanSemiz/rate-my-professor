package com.example.myapplication_java;

import static org.junit.Assert.assertNotNull;

import com.example.myapplication_java.Activities.MainActivity;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;

/**
 * This test case checks whether the app crashes when we start the app on the HomeScreen.
 */
@RunWith(RobolectricTestRunner.class)
public class MainActivitySmokeTest {

    @Test
    public void mainActivityStartsWithoutCrashing() {
        MainActivity activity = Robolectric
                .buildActivity(MainActivity.class)
                .setup()
                .get();

        assertNotNull(activity);
    }
}