package com.example.ratemyprofessor;

import static org.junit.Assert.assertNotNull;

import com.example.ratemyprofessor.Activities.StartActivity;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;

/**
 * This test case checks whether the app crashes on start up.
 */
@RunWith(RobolectricTestRunner.class)
public class StartActivitySmokeTest {

    @Test
    public void appStartsWithoutCrashing() {
        StartActivity activity = Robolectric
                .buildActivity(StartActivity.class)
                .setup()
                .get();

        assertNotNull(activity);
    }
}