package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import android.app.Dialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.view.MotionEvent;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.activities.LoginActivity;
import com.example.ratemyprofessor.activities.MainActivity;
import com.example.ratemyprofessor.adapters.CommentsAdapter;
import com.example.ratemyprofessor.adapters.LectureAdapter;
import com.example.ratemyprofessor.adapters.ListOfMyRatingsAdapter;
import com.example.ratemyprofessor.adapters.NotificationAdapter;
import com.example.ratemyprofessor.adapters.ProfessorAdapter;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.SelectionType;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.fragments.HomeFragment;
import com.example.ratemyprofessor.fragments.ListOfMyRatingsFragment;
import com.example.ratemyprofessor.fragments.NotificationFragment;
import com.example.ratemyprofessor.fragments.ProfileFragment;
import com.example.ratemyprofessor.fragments.ReplyFragment;
import com.example.ratemyprofessor.fragments.SearchFragment;
import com.example.ratemyprofessor.fragments.SelectionFragment;
import com.example.ratemyprofessor.fragments.SettingsFragment;
import com.example.ratemyprofessor.logic.SearchViewModel;
import com.example.ratemyprofessor.servercommunication.ContentStatus;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationType;
import com.example.ratemyprofessor.servercommunication.responses.NotificationsResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorShortResponse;
import com.example.ratemyprofessor.servercommunication.responses.StudentProfileResponse;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingDto;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingResponse;

import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.Shadows;
import org.robolectric.shadows.ShadowDialog;
import org.robolectric.shadows.ShadowToast;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import okhttp3.ResponseBody;
import retrofit2.Call;

@RunWith(RobolectricTestRunner.class)
public class GeneralFragmentCoverageTest {

    @After
    public void resetTheme() {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_UNSPECIFIED);
    }

    @Test
    public void homeShowsCacheRefreshesProfileDownloadsImageAndNavigates() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            HomeFragment home = (HomeFragment) current(activity);
            activity.getSharedPreferences(RateMyProfessorApplication.STATISTICS_STORAGE, 0)
                    .edit().putString("username", "Cached User")
                    .putFloat("averageRating", 3.14f).putInt("ratingCount", 7)
                    .putInt("writtencomments", 8).putInt("credibilityScore", 9).apply();
            home.setStatsAndUsername();
            assertEquals("Cached User", text(home, R.id.user_name));
            assertEquals("π", text(home, R.id.average_rating_given_num));
            assertEquals("7", text(home, R.id.professors_rated_num));

            StudentProfileResponse profile = new StudentProfileResponse(
                    "ok", true, "Fresh User", "avatar.svg", 4.25, 11, 12, 13);
            doReturn(TestSupport.success(profile)).when(backend.api).getUserInformation(anyString());
            doReturn(TestSupport.success(ResponseBody.create(null, new byte[]{1, 2, 3})))
                    .when(backend.api).downloadImage(anyString());
            backend.loggedIn();
            home.setStatsAndUsername();
            assertEquals("Fresh User", text(home, R.id.user_name));
            assertEquals("4.25", text(home, R.id.average_rating_given_num));

            doReturn(TestSupport.success(new NotificationsResponse("ok", true, Collections.emptyList())))
                    .when(backend.api).getNotifications(anyString());
            home.requireView().findViewById(R.id.notifications).performClick();
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertTrue(current(activity) instanceof NotificationFragment);
            activity.getSupportFragmentManager().popBackStackImmediate();
            home = (HomeFragment) current(activity);
            doReturn(TestSupport.success(new UserRatingResponse("ok", true, Collections.emptyList())))
                    .when(backend.api).getUserRatings(anyString());
            home.requireView().findViewById(R.id.list_of_my_ratings_button).performClick();
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertTrue(current(activity) instanceof ListOfMyRatingsFragment);
        }
    }

    @Test
    public void homeHandlesExpiredFailedAndDetachedResponses() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            HomeFragment home = (HomeFragment) current(activity);
            backend.loggedIn();
            doReturn(TestSupport.httpError(401)).when(backend.api).getUserInformation(anyString());
            home.setStatsAndUsername();
            Intent intent = Shadows.shadowOf(activity).getNextStartedActivity();
            assertNotNull(intent);
            assertEquals(LoginActivity.class.getName(), intent.getComponent().getClassName());
            assertTrue(activity.isFinishing());

            HomeFragment detached = new HomeFragment();
            TestSupport.invoke(detached, "showProfile",
                    new Class<?>[]{String.class, double.class, int.class, int.class, int.class},
                    "ignored", 1.0, 1, 1, 1);
            boolean saved = (boolean) TestSupport.invoke(detached, "saveImageAndSetProfilePicture",
                    new Class<?>[]{ResponseBody.class}, ResponseBody.create(null, "x"));
            assertFalse(saved);
        }
    }

    @Test
    public void searchScreenControlsSearchModeInputTabsAndSelectionChildren() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            SearchFragment search = backend.show(activity, new SearchFragment());
            View view = search.requireView();

            view.findViewById(R.id.search_button).performClick();
            assertEquals(View.VISIBLE, view.findViewById(R.id.searchBar).getVisibility());
            ((EditText) view.findViewById(R.id.searchInput)).setText("Ada");
            SearchViewModel model = new ViewModelProvider(search).get(SearchViewModel.class);
            assertEquals("Ada", model.getQuery().getValue());
            view.findViewById(R.id.clearSearchButton).performClick();
            assertEquals("", model.getQuery().getValue());
            assertEquals(View.GONE, view.findViewById(R.id.searchBar).getVisibility());
            view.findViewById(R.id.lecturesButton).performClick();
            view.findViewById(R.id.profsButton).performClick();
            view.findViewById(R.id.searchRoot).performClick();

            Professor professor = TestSupport.professor("p1");
            Lecture lecture = TestSupport.lecture("l1");
            doReturn(TestSupport.failure(new RuntimeException("unused")))
                    .when(backend.api).getProfessor(anyString());
            when(backend.search.searchProfessors("Ada")).thenReturn(Collections.singletonList(professor));
            when(backend.search.searchLectures("Algo")).thenReturn(Collections.singletonList(lecture));

            AtomicBoolean touched = new AtomicBoolean();
            SelectionFragment professorList = SelectionFragment.newInstance(SelectionType.PROFESSORS);
            professorList.setUserInteractionListener(() -> touched.set(true));
            search.getChildFragmentManager().beginTransaction().add(professorList, "prof-test").commitNow();
            model.setQuery("Ada");
            TestSupport.await(() -> adapterCount(professorList) == 1);
            RecyclerView professorRecycler = professorList.requireView().findViewById(R.id.list);
            ProfessorAdapter professorAdapter = (ProfessorAdapter) professorRecycler.getAdapter();
            ProfessorAdapter.ProfessorViewHolder ph = professorAdapter.onCreateViewHolder(professorRecycler, 0);
            professorAdapter.onBindViewHolder(ph, 0);
            ph.itemView.performClick();
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertTrue(current(activity) instanceof ProfileFragment);

            activity.getSupportFragmentManager().popBackStackImmediate();
            search = (SearchFragment) current(activity);
            model = new ViewModelProvider(search).get(SearchViewModel.class);
            SelectionFragment lectureList = SelectionFragment.newInstance(SelectionType.LECTURES);
            search.getChildFragmentManager().beginTransaction().add(lectureList, "lecture-test").commitNow();
            model.setQuery("Algo");
            TestSupport.await(() -> adapterCount(lectureList) == 1);
            RecyclerView lectureRecycler = lectureList.requireView().findViewById(R.id.list);
            LectureAdapter lectureAdapter = (LectureAdapter) lectureRecycler.getAdapter();
            LectureAdapter.LectureViewHolder lh = lectureAdapter.onCreateViewHolder(lectureRecycler, 0);
            lectureAdapter.onBindViewHolder(lh, 0);
            lh.itemView.performClick();
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertTrue(current(activity) instanceof ProfileFragment);

            MotionEvent event = MotionEvent.obtain(0, 0, MotionEvent.ACTION_DOWN, 1, 1, 0);
            professorRecycler.dispatchTouchEvent(event);
            event.recycle();
        }
    }

    @Test
    public void profileCoversProfessorAndLectureEntryPathsAndSemesterNavigation() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            Professor professor = TestSupport.professor("p1");
            Lecture lecture = TestSupport.lecture("l1");
            Semester semester = new Semester(2026, SemesterSeason.WS);
            when(backend.search.getProfessorById("p1")).thenReturn(professor);
            when(backend.search.getLectureTitlesByProfessor("p1"))
                    .thenReturn(Arrays.asList("Algorithms", "Databases"));
            when(backend.search.getSemestersByProfessorAndLectureTitle(anyString(), anyString()))
                    .thenReturn(Collections.singletonList(semester));
            when(backend.search.getLecture(anyString(), anyString(), any(Integer.class), any(SemesterSeason.class)))
                    .thenReturn(Collections.singletonList(lecture));
            ProfessorResponse response = new ProfessorResponse("p1", "Ada", "Lovelace", true,
                    4.75, 10, Collections.singletonList("l1"));
            doReturn(TestSupport.success(new ProfessorDetailResponse("ok", true, response)))
                    .when(backend.api).getProfessor("p1");

            ProfileFragment byProfessor = backend.show(activity, new ProfileFragment(professor));
            TestSupport.await(() -> adapterCount(byProfessor, R.id.lecture_list) == 2
                    && adapterCount(byProfessor, R.id.semester_list) == 1);
            assertEquals("Ada", text(byProfessor, R.id.name));
            assertEquals("Lovelace", text(byProfessor, R.id.surname));
            assertEquals("4.8", text(byProfessor, R.id.averageRatingBackground));

            TestSupport.invoke(byProfessor, "onLectureClicked", new Class<?>[]{String.class}, "Databases");
            TestSupport.invoke(byProfessor, "openLectureProfile", new Class<?>[]{Semester.class}, semester);
            TestSupport.await(() -> current(activity) instanceof com.example.ratemyprofessor.fragments.RatingsFragment);

            activity.openHome();
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            when(backend.search.getLecturesByTitle("Algorithms")).thenReturn(Collections.singletonList(lecture));
            when(backend.search.getProfessorsByLectureTitle("Algorithms"))
                    .thenReturn(Collections.singletonList(professor));
            ProfileFragment byLecture = backend.show(activity, new ProfileFragment("Algorithms"));
            TestSupport.await(() -> adapterCount(byLecture, R.id.lecture_list) == 1);
            assertEquals(View.GONE, byLecture.requireView().findViewById(R.id.name).getVisibility());
            assertEquals("Algorithms", text(byLecture, R.id.surname));
            TestSupport.invoke(byLecture, "onProfessorClicked", new Class<?>[]{Professor.class}, professor);
            byLecture.onResume();
            TestSupport.await(() -> adapterCount(byLecture, R.id.semester_list) == 1);

            ProfileFragment detached = new ProfileFragment();
            AtomicBoolean ran = new AtomicBoolean();
            TestSupport.invoke(detached, "runOnUiThread", new Class<?>[]{Runnable.class},
                    (Runnable) () -> ran.set(true));
            assertFalse(ran.get());
            detached.onDestroy();
        }
    }

    @Test
    public void settingsCoversVisibilityThemeDialogsRequestsAndLoginNavigation() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            SettingsFragment settings = backend.show(activity, new SettingsFragment());
            assertEquals(View.VISIBLE, settings.requireView().findViewById(R.id.login_button).getVisibility());
            assertEquals(View.GONE, settings.requireView().findViewById(R.id.logout_all_devices_button).getVisibility());
            settings.requireView().findViewById(R.id.login_button).performClick();
            Intent login = Shadows.shadowOf(activity).getNextStartedActivity();
            assertEquals(LoginActivity.class.getName(), login.getComponent().getClassName());
            assertFalse(login.getBooleanExtra("skip_login", true));

            TestSupport.invoke(settings, "setNightMode", new Class<?>[]{boolean.class}, true);
            TestSupport.invoke(settings, "setNightMode", new Class<?>[]{boolean.class}, true);

            backend.loggedIn();
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).reportBug(anyString(), any());
            settings.requireView().findViewById(R.id.bug_report).performClick();
            Dialog dialog = ShadowDialog.getLatestDialog();
            assertNotNull(dialog);
            dialog.findViewById(R.id.bug_report_submit).performClick();
            EditText title = dialog.findViewById(R.id.bug_report_title_input);
            EditText report = dialog.findViewById(R.id.bug_report_input);
            assertNotNull(title.getError());
            title.setText("Broken button");
            dialog.findViewById(R.id.bug_report_submit).performClick();
            assertNotNull(((com.google.android.material.textfield.TextInputLayout)
                    dialog.findViewById(R.id.bug_report_input_layout)).getError());
            report.setText("Steps to reproduce");
            dialog.findViewById(R.id.bug_report_submit).performClick();
            assertFalse(dialog.isShowing());
            assertNotNull(ShadowToast.getTextOfLatestToast());

            backend.loggedIn();
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).logoutAllDevices(anyString());
            TestSupport.invoke(settings, "logoutOnAllDevices", new Class<?>[0]);
            assertFalse(LoginSession.from(activity).isLoggedIn());

            backend.loggedIn();
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).deleteAccount(anyString());
            TestSupport.invoke(settings, "deleteAccount", new Class<?>[0]);
            assertFalse(LoginSession.from(activity).isLoggedIn());

            backend.loggedIn();
            settings.requireView().findViewById(R.id.logout_all_devices_button).performClick();
            AlertDialog confirmation = (AlertDialog) ShadowDialog.getLatestDialog();
            confirmation.getButton(DialogInterface.BUTTON_NEGATIVE).performClick();
            settings.requireView().findViewById(R.id.delete_account_button).performClick();
            confirmation = (AlertDialog) ShadowDialog.getLatestDialog();
            confirmation.getButton(DialogInterface.BUTTON_NEGATIVE).performClick();
        }
    }

    @Test
    public void settingsCoversMissingLoginOfflineAndFailedCallbacks() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            SettingsFragment settings = backend.show(activity, new SettingsFragment());
            TestSupport.invoke(settings, "logoutOnAllDevices", new Class<?>[0]);
            TestSupport.invoke(settings, "deleteAccount", new Class<?>[0]);

            backend.loggedIn();
            backend.setNetworkAvailable(false);
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).logoutAllDevices(anyString());
            TestSupport.invoke(settings, "logoutOnAllDevices", new Class<?>[0]);
            assertEquals("Internet not available", ShadowToast.getTextOfLatestToast());

            backend.setNetworkAvailable(true);
            doReturn(TestSupport.success(new BasicResponse("no", false)))
                    .when(backend.api).logoutAllDevices(anyString());
            TestSupport.invoke(settings, "logoutOnAllDevices", new Class<?>[0]);
            doReturn(TestSupport.failure(new RuntimeException("down")))
                    .when(backend.api).logoutAllDevices(anyString());
            TestSupport.invoke(settings, "logoutOnAllDevices", new Class<?>[0]);

            doReturn(TestSupport.success(new BasicResponse("no", false)))
                    .when(backend.api).deleteAccount(anyString());
            TestSupport.invoke(settings, "deleteAccount", new Class<?>[0]);
            doReturn(TestSupport.failure(new RuntimeException("down")))
                    .when(backend.api).deleteAccount(anyString());
            TestSupport.invoke(settings, "deleteAccount", new Class<?>[0]);
            assertNotNull(ShadowToast.getTextOfLatestToast());
        }
    }

    @Test
    public void notificationsLoadConvertMarkReadOpenThreadAndCancelCalls() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            backend.loggedIn();
            LectureResponse lecture = lectureResponse();
            NotificationResponse answer = new NotificationResponse("n1", NotificationType.ANSWER,
                    lecture, "c1", "Ada", "A reply", null, LocalDateTime.of(2026, 1, 2, 3, 4));
            NotificationResponse warning = new NotificationResponse(null, NotificationType.WARNING,
                    null, null, null, null, "Warning text", null);
            Call<NotificationsResponse> notificationCall = TestSupport.success(
                    new NotificationsResponse("ok", true, Arrays.asList(answer, warning)));
            doReturn(notificationCall).when(backend.api).getNotifications(anyString());
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).markNotificationsAsSeen(anyString(), anyString());
            Comment comment = comment("c1", Collections.emptyList());
            Call<CommentsResponse> commentsCall = TestSupport.success(
                    new CommentsResponse("ok", true, Collections.singletonList(comment)));
            doReturn(commentsCall).when(backend.api).getComments(anyString(), anyString());

            NotificationFragment fragment = backend.show(activity, new NotificationFragment());
            RecyclerView list = fragment.requireView().findViewById(R.id.notification_list);
            assertEquals(2, list.getAdapter().getItemCount());
            NotificationAdapter adapter = (NotificationAdapter) list.getAdapter();
            NotificationAdapter.NotificationViewHolder holder = adapter.onCreateViewHolder(list, 0);
            adapter.onBindViewHolder(holder, 0);
            holder.itemView.performClick();
            Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertTrue(current(activity) instanceof ReplyFragment);

            activity.getSupportFragmentManager().popBackStackImmediate();
            fragment = (NotificationFragment) current(activity);
            Object converted = TestSupport.invoke(fragment, "convertNotification",
                    new Class<?>[]{NotificationResponse.class}, warning);
            assertNotNull(converted);
            assertEquals("", TestSupport.invoke(fragment, "valueOrEmpty",
                    new Class<?>[]{String.class}, new Object[]{null}));
            assertEquals("", TestSupport.invoke(fragment, "createLectureLabel",
                    new Class<?>[]{LectureResponse.class}, new Object[]{null}));
            assertSame(comment, TestSupport.invoke(fragment, "findComment",
                    new Class<?>[]{List.class, String.class}, Collections.singletonList(comment), "c1"));
            assertEquals(null, TestSupport.invoke(fragment, "findComment",
                    new Class<?>[]{List.class, String.class}, Collections.singletonList(comment), "missing"));
            fragment.onDestroyView();
            verify(notificationCall, atLeastOnce()).cancel();
            verify(commentsCall, atLeastOnce()).cancel();
        }
    }

    @Test
    public void notificationsCoverEmptyErrorAndNetworkFailureStates() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            doReturn(TestSupport.success(new NotificationsResponse("empty", true, null)))
                    .when(backend.api).getNotifications(anyString());
            NotificationFragment empty = backend.show(activity, new NotificationFragment());
            assertEquals(View.VISIBLE, empty.requireView().findViewById(R.id.empty_notifications).getVisibility());

            doReturn(TestSupport.success(new NotificationsResponse("server error", false, null)))
                    .when(backend.api).getNotifications(anyString());
            backend.show(activity, new NotificationFragment());
            assertEquals("server error", ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.failure(new RuntimeException("down")))
                    .when(backend.api).getNotifications(anyString());
            backend.show(activity, new NotificationFragment());
            assertEquals("Keine Verbindung zum Server", ShadowToast.getTextOfLatestToast());
        }
    }

    @Test
    public void replyBindsInputSendsAnswersVotesReportsAndHandlesFailures() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            backend.loggedIn();
            Comment reply = comment("r1", Collections.emptyList());
            Comment comment = new Comment("c1", "Main comment", ContentStatus.VISIBLE, "Ada", "l1",
                    null, LocalDateTime.now(), 2, 5, VoteType.UP, Collections.singletonList(reply));
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).postAnswer(anyString(), any());
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).voteComment(anyString(), anyString(), any());
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).voteAnswer(anyString(), anyString(), any());
            ReplyFragment fragment = backend.show(activity, new ReplyFragment(comment));
            assertEquals("Main comment", text(fragment, R.id.content_text));
            assertEquals("1", text(fragment, R.id.comments_num));
            EditText input = fragment.requireView().findViewById(R.id.input_reply);
            input.requestFocus();
            assertEquals(View.VISIBLE, fragment.requireView().findViewById(R.id.cancel_reply).getVisibility());
            input.setText("  answer  ");
            assertTrue(fragment.requireView().findViewById(R.id.submit_reply).isEnabled());
            fragment.requireView().findViewById(R.id.submit_reply).performClick();
            assertEquals("", input.getText().toString());
            assertEquals("Reply sent.", ShadowToast.getTextOfLatestToast());

            fragment.requireView().findViewById(R.id.upvote_icon).performClick();
            fragment.requireView().findViewById(R.id.downvote_icon).performClick();
            fragment.vote("c1", VoteType.UP, com.example.ratemyprofessor.domain.CommentType.COMMENT);
            fragment.reportComment("c1");
            Dialog reportDialog = ShadowDialog.getLatestDialog();
            assertNotNull(reportDialog);
            reportDialog.dismiss();
            fragment.reportReply("r1");
            assertNotNull(ShadowDialog.getLatestDialog());
            ShadowDialog.getLatestDialog().dismiss();
            fragment.onOpenReplies(comment);

            input.setText("cancel");
            fragment.requireView().findViewById(R.id.cancel_reply).performClick();
            assertEquals("", input.getText().toString());

            doReturn(TestSupport.failure(new RuntimeException("down")))
                    .when(backend.api).postAnswer(anyString(), any());
            input.setText("fails");
            fragment.requireView().findViewById(R.id.submit_reply).performClick();
            assertEquals("Reply couldn't be sent.", ShadowToast.getTextOfLatestToast());

            backend.loggedOut();
            input.setText("not logged in");
            fragment.requireView().findViewById(R.id.submit_reply).performClick();
            fragment.requireView().findViewById(R.id.upvote_icon).performClick();
            assertEquals("You are not logged in.", ShadowToast.getTextOfLatestToast());
            TestSupport.invoke(fragment, "onReplySend",
                    new Class<?>[]{String.class, String.class}, "c1", "   ");
            assertNotNull(input.getError());
        }
    }

    @Test
    public void ownRatingsListLoadsAndNavigatesOrKeepsCurrentScreenWhenMissing() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            UserRatingDto dto = new UserRatingDto(lectureResponse(), 4.0);
            doReturn(TestSupport.success(new UserRatingResponse("ok", true, Collections.singletonList(dto))))
                    .when(backend.api).getUserRatings(anyString());
            ListOfMyRatingsFragment fragment = backend.show(activity, new ListOfMyRatingsFragment());
            assertEquals(1, adapterCount(fragment, R.id.list_of_my_ratings_list));

            Semester semester = new Semester(2026, SemesterSeason.WS);
            Lecture lecture = TestSupport.lecture("l1");
            Professor professor = TestSupport.professor("p1");
            when(backend.search.getLecture("p1", "Algorithms", 2026, SemesterSeason.WS))
                    .thenReturn(Collections.emptyList(), Collections.singletonList(lecture));
            when(backend.search.getProfessorById("p1")).thenReturn(professor);
            fragment.openRating(semester, "p1", "Algorithms");
            TestSupport.await(() -> current(activity) == fragment);
            fragment.openRating(semester, "p1", "Algorithms");
            TestSupport.await(() -> current(activity) instanceof com.example.ratemyprofessor.fragments.RatingsFragment);
        }
    }

    private static Fragment current(MainActivity activity) {
        return activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container);
    }

    private static String text(Fragment fragment, int id) {
        return ((TextView) fragment.requireView().findViewById(id)).getText().toString();
    }

    private static int adapterCount(Fragment fragment) {
        return adapterCount(fragment, R.id.list);
    }

    private static int adapterCount(Fragment fragment, int id) {
        if (fragment.getView() == null) {
            return -1;
        }
        RecyclerView list = fragment.requireView().findViewById(id);
        return list == null || list.getAdapter() == null ? -1 : list.getAdapter().getItemCount();
    }

    private static Comment comment(String id, List<Comment> answers) {
        return new Comment(id, "Content", ContentStatus.VISIBLE, "User", "l1", null,
                LocalDateTime.of(2026, 1, 2, 3, 4), 1, 2, VoteType.DOWN, answers);
    }

    private static LectureResponse lectureResponse() {
        ProfessorShortResponse professor = new ProfessorShortResponse("p1", "Ada", "Lovelace", true);
        return new LectureResponse("l1", "Algorithms", "CS101", 2026, SemesterSeason.WS,
                "WS 2026", "Algorithms", true, null, Collections.singletonList(professor),
                1, 1, 4.0);
    }
}
