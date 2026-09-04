package com.example.ratemyprofessor;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.example.ratemyprofessor.Activities.LoginActivity;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class UserStoryInstrumentedTest {

    @Rule
    public ActivityScenarioRule<LoginActivity> activityRule =
            new ActivityScenarioRule<>(LoginActivity.class);

    @Test
    public void kitStudentCanNavigateLoginFlow() {
        // Step 1: LoginActivity - Enter Email
        onView(withId(R.id.mail_input))
                .perform(typeText("student@kit.edu"));
        
        onView(withId(R.id.verify_button))
                .perform(click());

        // Step 2: EnterAuthTokenActivity should be displayed
        onView(withText("Enter your code"))
                .check(matches(isDisplayed()));

        // Step 3: Enter Token
        onView(withId(R.id.code_input))
                .perform(typeText("123456"));

        onView(withId(R.id.enter_button))
                .perform(click());
    }

    @Test
    public void mainActivityShowsBottomNavigation() {
        onView(withId(R.id.custom_bottom_nav))
                .check(matches(isDisplayed()));
    }
}
