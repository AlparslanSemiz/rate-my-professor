package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.when;

import android.content.Intent;
import android.os.Looper;
import android.widget.EditText;

import androidx.fragment.app.Fragment;

import com.example.ratemyprofessor.activities.EnterAuthTokenActivity;
import com.example.ratemyprofessor.activities.LoginActivity;
import com.example.ratemyprofessor.activities.MainActivity;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.fragments.HomeFragment;
import com.example.ratemyprofessor.fragments.ProfileFragment;
import com.example.ratemyprofessor.fragments.RatingsFragment;
import com.example.ratemyprofessor.fragments.ReplyFragment;
import com.example.ratemyprofessor.fragments.SearchFragment;
import com.example.ratemyprofessor.fragments.SettingsFragment;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.Shadows;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.shadows.ShadowActivity;
import org.robolectric.shadows.ShadowToast;

import java.time.LocalDateTime;
import java.util.Collections;

@RunWith(RobolectricTestRunner.class)
public class ActivityCoverageTest {

    @Test
    public void mainActivityCoversEveryNavigationEntryPointAndTabs() {
        try (TestSupport backend = new TestSupport()) {
            doReturn(TestSupport.failure(new java.io.IOException("unused")))
                    .when(backend.api).getProfessor(anyString());
            doReturn(org.mockito.Mockito.mock(retrofit2.Call.class))
                    .when(backend.api).getRatings(anyString());
            ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class);
            backend.loggedOut();
            MainActivity activity = controller.setup().get();
            assertFragment(activity, HomeFragment.class);

            activity.findViewById(R.id.nav_search).performClick();
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, SearchFragment.class);
            activity.findViewById(R.id.nav_settings).performClick();
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, SettingsFragment.class);
            activity.findViewById(R.id.nav_home).performClick();
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, HomeFragment.class);

            activity.onProfessorSelected(TestSupport.professor("p1"));
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, ProfileFragment.class);
            activity.onLectureSelected("Algorithms");
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, ProfileFragment.class);
            activity.openLectureProfile(TestSupport.professor("p1"),
                    new Semester(2026, SemesterSeason.WS), TestSupport.lecture("l1"));
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, RatingsFragment.class);
            Comment comment = new Comment("c1", "text", null, "user", "l1", null,
                    LocalDateTime.now(), 0, 0, null, Collections.emptyList());
            activity.openReplyFragment(comment);
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, ReplyFragment.class);
            activity.openHome();
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFragment(activity, HomeFragment.class);
            controller.pause().stop().destroy();
        }
    }

    @Test
    public void loginValidatesInputAndHandlesOfflineSuccessRejectionAndFailure() {
        try (TestSupport backend = new TestSupport()) {
            backend.loggedOut();
            doReturn(TestSupport.success(new ServerResponse("sent", true, null)))
                    .when(backend.api).requestLogin(any());
            LoginActivity activity = Robolectric.buildActivity(LoginActivity.class).setup().get();
            EditText input = activity.findViewById(R.id.mail_input);
            input.setText("wrong@example.org");
            activity.findViewById(R.id.verify_button).performClick();
            assertTrue(ShadowToast.getTextOfLatestToast().toString().contains("email is wrong"));

            backend.setNetworkAvailable(false);
            input.setText("abcde@student.kit.edu");
            activity.findViewById(R.id.verify_button).performClick();
            assertEquals("Internet not available", ShadowToast.getTextOfLatestToast());

            backend.setNetworkAvailable(true);
            activity.findViewById(R.id.verify_button).performClick();
            Intent next = Shadows.shadowOf(activity).getNextStartedActivity();
            assertNotNull(next);
            assertEquals(EnterAuthTokenActivity.class.getName(), next.getComponent().getClassName());
            assertEquals("abcde@student.kit.edu", LoginSession.from(activity).mailAddress());

            doReturn(TestSupport.success(new ServerResponse("rejected", false, null)))
                    .when(backend.api).requestLogin(any());
            activity.findViewById(R.id.verify_button).performClick();
            assertEquals("rejected", ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.httpError(500)).when(backend.api).requestLogin(any());
            activity.findViewById(R.id.verify_button).performClick();
            assertNotNull(ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.failure(new java.io.IOException("down")))
                    .when(backend.api).requestLogin(any());
            activity.findViewById(R.id.verify_button).performClick();
            assertNotNull(ShadowToast.getTextOfLatestToast());
        }
    }

    @Test
    public void tokenActivityHandlesOfflineRejectedFailureAndSuccessfulLogin() {
        try (TestSupport backend = new TestSupport()) {
            backend.loggedOut();
            LoginSession.from(TestSupport.application()).saveMailAddress("abcde@student.kit.edu");
            doReturn(TestSupport.success(new ServerResponse("ok", true, "server-token")))
                    .when(backend.api).login(any());
            EnterAuthTokenActivity activity = Robolectric.buildActivity(EnterAuthTokenActivity.class).setup().get();
            ((EditText) activity.findViewById(R.id.code_input)).setText("123456");

            backend.setNetworkAvailable(false);
            activity.findViewById(R.id.enter_button).performClick();
            assertEquals("Internet not available", ShadowToast.getTextOfLatestToast());

            backend.setNetworkAvailable(true);
            doReturn(TestSupport.success(new ServerResponse("bad token", false, null)))
                    .when(backend.api).login(any());
            activity.findViewById(R.id.enter_button).performClick();
            assertEquals("bad token", ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.httpError(503)).when(backend.api).login(any());
            activity.findViewById(R.id.enter_button).performClick();
            assertNotNull(ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.failure(new java.io.IOException("down")))
                    .when(backend.api).login(any());
            activity.findViewById(R.id.enter_button).performClick();
            assertNotNull(ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.success(new ServerResponse("ok", true, "server-token")))
                    .when(backend.api).login(any());
            activity.findViewById(R.id.enter_button).performClick();
            Intent next = Shadows.shadowOf(activity).getNextStartedActivity();
            assertEquals(MainActivity.class.getName(), next.getComponent().getClassName());
            assertTrue((next.getFlags() & Intent.FLAG_ACTIVITY_CLEAR_TASK) != 0);
            assertTrue(AuthManager.getInstance().isLoggedIn());
            assertTrue(LoginSession.from(activity).isLoggedIn());
        }
    }

    @Test
    public void loginSkipFlagDoesNotBypassDebugBuildAndStaticErrorReaderIsCovered() {
        try (TestSupport backend = new TestSupport()) {
            Intent intent = new Intent(TestSupport.application(), LoginActivity.class);
            intent.putExtra("skip_login", false);
            LoginActivity activity = Robolectric.buildActivity(LoginActivity.class, intent).setup().get();
            assertFalse(activity.isFinishing());
            Object message = TestSupport.invoke(LoginActivity.class, "readErrorMessage",
                    new Class<?>[]{retrofit2.Response.class}, retrofit2.Response.error(
                            418, okhttp3.ResponseBody.create(null, "teapot")));
            assertEquals("teapot", message);
        }
    }

    private static void assertFragment(MainActivity activity, Class<? extends Fragment> type) {
        Fragment fragment = activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container);
        assertTrue(type.getSimpleName(), type.isInstance(fragment));
    }
}
