package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.timeout;

import android.app.Dialog;
import android.os.Looper;
import android.widget.EditText;
import android.widget.TextView;

import com.example.ratemyprofessor.activities.MainActivity;
import com.example.ratemyprofessor.adapters.RatingAdapter;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.CommentModel;
import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.fragments.RatingsFragment;
import com.example.ratemyprofessor.fragments.ReplyFragment;
import com.example.ratemyprofessor.servercommunication.ContentStatus;
import com.example.ratemyprofessor.servercommunication.requests.RatingTopicRequest;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoryResponse;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.Shadows;
import org.robolectric.shadows.ShadowDialog;
import org.robolectric.shadows.ShadowToast;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@RunWith(RobolectricTestRunner.class)
public class RatingsFragmentCoverageTest {

    @Test
    public void ratingsHappyPathCoversCacheServerFormattingCommentsAndSubmission() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            backend.loggedIn();
            Lecture lecture = TestSupport.lecture("l1");
            Professor professor = TestSupport.professor("p1");
            Semester semester = new Semester(2026, SemesterSeason.WS);
            Comment reply = comment("r1", Collections.emptyList());
            Comment comment = comment("c1", Collections.singletonList(reply));

            CommentModel cachedReply = model("r1", "c1");
            CommentModel cachedComment = model("c1", null);
            when(backend.search.getComments("l1")).thenReturn(Collections.singletonList(cachedComment));
            when(backend.search.getReplies("c1")).thenReturn(Collections.singletonList(cachedReply));
            when(backend.search.getLectureRatings("l1", Rater.AVERAGE)).thenReturn(Arrays.asList(
                    new Rating("l1", RatingCategory.OVERALL, 4.0, Rater.AVERAGE),
                    new Rating("l1", RatingCategory.ROOM, 4.5, Rater.AVERAGE)));
            when(backend.search.getLectureRatings("l1", Rater.USER)).thenReturn(Arrays.asList(
                    new Rating("l1", RatingCategory.OVERALL, 3.0, Rater.USER),
                    new Rating("l1", RatingCategory.ROOM, 3.5, Rater.USER)));

            doReturn(TestSupport.success(new CommentsResponse("ok", true,
                    Collections.singletonList(comment))))
                    .when(backend.api).getComments(anyString(), anyString());
            List<TopicAverageResponse> averages = Arrays.asList(
                    new TopicAverageResponse(RatingCategory.OVERALL, 4.0),
                    new TopicAverageResponse(null, 2.0),
                    new TopicAverageResponse(RatingCategory.ROOM, 4.5),
                    new TopicAverageResponse(RatingCategory.ORGANIZATION, 3.5));
            doReturn(TestSupport.success(new RatingAverageResponse("ok", true, averages)))
                    .when(backend.api).getRatings("l1");
            doReturn(TestSupport.success(new RatingAverageResponse("ok", true, Arrays.asList(
                    new TopicAverageResponse(RatingCategory.OVERALL, 3.0),
                    new TopicAverageResponse(RatingCategory.ROOM, 3.5)))))
                    .when(backend.api).getOwnRatings(anyString(), anyString());
            doReturn(TestSupport.success(new LectureDetailResponse("ok", true, lectureResponse(4.75))))
                    .when(backend.api).getLecture("l1");
            doReturn(TestSupport.success(new ProfessorDetailResponse("ok", true, professorResponse(4.8))))
                    .when(backend.api).getProfessor("p1");
            doReturn(TestSupport.success(new ServerResponse("ok", true, null)))
                    .when(backend.api).postComment(anyString(), any());
            doReturn(TestSupport.success(new ServerResponse("ok", true, null)))
                    .when(backend.api).submitRating(anyString(), any());
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).voteComment(anyString(), anyString(), any());
            doReturn(TestSupport.success(new BasicResponse("ok", true)))
                    .when(backend.api).reportComment(anyString(), any());

            RatingsFragment fragment = backend.show(activity, new RatingsFragment(professor, semester, lecture));
            RatingsFragment initialFragment = fragment;
            TestSupport.await(() -> TestSupport.getField(initialFragment, "ratingAdapter") != null);
            assertEquals("Algorithms", text(fragment, R.id.lecture_title));
            assertEquals("WS2026", text(fragment, R.id.term));
            TestSupport.await(() -> "4.8".equals(text(initialFragment, R.id.average_lecture_rating)));
            assertNotNull(TestSupport.getField(fragment, "commentsAdapter"));

            EditText input = fragment.requireView().findViewById(R.id.input_comment);
            input.requestFocus();
            input.setText("a comment");
            assertTrue(fragment.requireView().findViewById(R.id.submit_comment).isEnabled());
            fragment.requireView().findViewById(R.id.submit_comment).performClick();
            assertEquals("Your comment is sent.", ShadowToast.getTextOfLatestToast());
            input.setText("cancel me");
            fragment.requireView().findViewById(R.id.cancel_comment).performClick();
            assertEquals("", input.getText().toString());

            ArrayList<TopicAverageResponse> incompleteAverages = new ArrayList<>(
                    Collections.singletonList(new TopicAverageResponse(RatingCategory.ROOM, 4.0)));
            RatingAdapter incomplete = new RatingAdapter(incompleteAverages, null);
            TestSupport.setField(fragment, "ratingAdapter", incomplete);
            fragment.requireView().findViewById(R.id.submit_rating).performClick();
            assertEquals("Please rate all categories before submitting.", ShadowToast.getTextOfLatestToast());
            incomplete.onRatingChanged(RatingCategory.ROOM, 5.0);
            fragment.requireView().findViewById(R.id.submit_rating).performClick();
            assertEquals("Rating submitted successfully.", ShadowToast.getTextOfLatestToast());
            TestSupport.await(() -> lecture.averageRating == 4.75 && professor.averageRating == 4.8f);
            verify(backend.search, atLeastOnce()).updateLectureRating("l1", 4.75);

            fragment.onOpenReplies(comment);
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertTrue(activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container)
                    instanceof ReplyFragment);
            activity.getSupportFragmentManager().popBackStackImmediate();
            fragment = (RatingsFragment) activity.getSupportFragmentManager()
                    .findFragmentById(R.id.fragment_container);
            fragment.vote("c1", VoteType.UP, CommentType.COMMENT);
            fragment.reportComment("c1");
            Dialog dialog = ShadowDialog.getLatestDialog();
            assertNotNull(dialog);
            dialog.dismiss();
            fragment.reportReply("unused");
        }
    }

    @Test
    public void ratingsCoversEmptyRatingsCachedFallbackAndFailureCallbacks() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            backend.loggedIn();
            Lecture lecture = TestSupport.lecture("l1");
            Professor professor = TestSupport.professor("p1");
            Semester semester = new Semester(2026, SemesterSeason.WS);
            when(backend.search.getLectureRatings(anyString(), any(Rater.class)))
                    .thenReturn(Collections.emptyList());
            when(backend.search.getComments("l1")).thenReturn(Collections.emptyList());
            doReturn(TestSupport.httpError(500)).when(backend.api).getComments(anyString(), anyString());
            doReturn(TestSupport.success(new RatingAverageResponse("ok", true, Collections.emptyList())))
                    .when(backend.api).getRatings("l1");
            doReturn(TestSupport.success(new RatingCategoriesResponse("ok", true, Arrays.asList(
                    new RatingCategoryResponse(RatingCategory.ROOM, "Room", 1),
                    new RatingCategoryResponse(RatingCategory.ORGANIZATION, "Organization", 1)))))
                    .when(backend.api).getCategories("l1");
            doReturn(TestSupport.failure(new RuntimeException("lecture down")))
                    .when(backend.api).getLecture("l1");

            RatingsFragment fragment = backend.show(activity, new RatingsFragment(professor, semester, lecture));
            TestSupport.await(() -> TestSupport.getField(fragment, "ratingAdapter") != null);
            RatingAdapter adapter = TestSupport.getField(fragment, "ratingAdapter");
            assertEquals(2, adapter.getItemCount());

            doReturn(TestSupport.failure(new RuntimeException("own down")))
                    .when(backend.api).getOwnRatings(anyString(), anyString());
            List<TopicAverageResponse> average = Collections.singletonList(
                    new TopicAverageResponse(RatingCategory.ROOM, 4));
            TestSupport.invoke(fragment, "loadOwnRatings", new Class<?>[]{List.class}, average);
            TestSupport.await(() -> TestSupport.getField(fragment, "ratingAdapter") != null);

            doReturn(TestSupport.failure(new RuntimeException("comment down")))
                    .when(backend.api).postComment(anyString(), any());
            EditText input = fragment.requireView().findViewById(R.id.input_comment);
            input.setText("fails");
            fragment.requireView().findViewById(R.id.submit_comment).performClick();
            assertEquals("Your comment couldn't be sent.", ShadowToast.getTextOfLatestToast());

            RatingAdapter complete = new RatingAdapter(new ArrayList<>(average),
                    new ArrayList<>(average));
            TestSupport.setField(fragment, "ratingAdapter", complete);
            doReturn(TestSupport.failure(new RuntimeException("rating down")))
                    .when(backend.api).submitRating(anyString(), any());
            fragment.requireView().findViewById(R.id.submit_rating).performClick();
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertEquals("Your rating couldn't be sent.", ShadowToast.getTextOfLatestToast());

            doReturn(TestSupport.failure(new RuntimeException("prof down")))
                    .when(backend.api).getProfessor("p1");
            TestSupport.invoke(fragment, "updateProfRating", new Class<?>[0]);
            TestSupport.invoke(fragment, "updateLectureRating", new Class<?>[0]);
            TestSupport.invoke(fragment, "showRatings", new Class<?>[]{List.class, List.class},
                    null, null);
            TestSupport.invoke(fragment, "showRatings", new Class<?>[]{List.class, List.class},
                    Collections.emptyList(), null);
            List<TopicAverageResponse> formatted = (List<TopicAverageResponse>) TestSupport.invoke(
                    fragment, "formatUserRatings", new Class<?>[]{List.class, List.class},
                    average, Collections.emptyList());
            assertEquals(0, formatted.get(0).value(), 0.01);

            ArrayList<RatingTopicRequest> requests = new ArrayList<>();
            requests.add(new RatingTopicRequest(RatingCategory.ROOM, 2.5));
            TestSupport.invoke(fragment, "updateLocalRatingsFromRequest",
                    new Class<?>[]{List.class}, requests);
            TestSupport.invoke(fragment, "updateLocalRatingsFromResponse",
                    new Class<?>[]{List.class}, average);
            TestSupport.invoke(fragment, "applyLectureAverageFromServer",
                    new Class<?>[]{double.class}, 3.25);
            TestSupport.await(() -> lecture.averageRating == 3.25);
            fragment.onDestroyView();
            AtomicBoolean ran = new AtomicBoolean();
            TestSupport.invoke(fragment, "runOnUiThread", new Class<?>[]{Runnable.class},
                    (Runnable) () -> ran.set(true));
            Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertFalse(ran.get());
        }
    }

    @Test
    public void ratingsCoversLoggedOutCachePathAndDefaultConstructor() {
        try (TestSupport backend = new TestSupport()) {
            MainActivity activity = backend.launchMainActivity();
            Lecture lecture = TestSupport.lecture("l1");
            Professor professor = TestSupport.professor("p1");
            when(backend.search.getComments("l1")).thenReturn(Collections.emptyList());
            when(backend.search.getLectureRatings("l1", Rater.AVERAGE)).thenReturn(Arrays.asList(
                    new Rating("l1", RatingCategory.OVERALL, 3, Rater.AVERAGE),
                    new Rating("l1", RatingCategory.ROOM, 3.5, Rater.AVERAGE)));
            when(backend.search.getLectureRatings("l1", Rater.USER)).thenReturn(Collections.emptyList());
            doReturn(org.mockito.Mockito.mock(retrofit2.Call.class)).when(backend.api).getRatings("l1");
            doReturn(TestSupport.failure(new RuntimeException("unused"))).when(backend.api).getLecture("l1");
            RatingsFragment fragment = backend.show(activity, new RatingsFragment(
                    professor, new Semester(2026, SemesterSeason.WS), lecture));
            TestSupport.await(() -> TestSupport.getField(fragment, "ratingAdapter") != null);
            assertEquals("You are not logged in.", ShadowToast.getTextOfLatestToast());
            new RatingsFragment();
        }
    }

    private static Comment comment(String id, List<Comment> replies) {
        return new Comment(id, "Comment " + id, ContentStatus.VISIBLE, "Ada", "l1", null,
                LocalDateTime.of(2026, 1, 2, 3, 4), 1, 2, VoteType.UP, replies);
    }

    private static CommentModel model(String id, String parent) {
        return new CommentModel(id, parent, "Cached " + id, ContentStatus.VISIBLE, "Ada", "l1",
                LocalDateTime.of(2026, 1, 2, 3, 4), 1, 2);
    }

    private static LectureResponse lectureResponse(double average) {
        return new LectureResponse("l1", "Algorithms", "CS101", 2026, SemesterSeason.WS,
                "WS 2026", "Algorithms", true, null, Collections.emptyList(), 1, 2, average);
    }

    private static ProfessorResponse professorResponse(double average) {
        return new ProfessorResponse("p1", "Ada", "Lovelace", true, average, 3,
                Collections.singletonList("l1"));
    }

    private static String text(RatingsFragment fragment, int id) {
        return ((TextView) fragment.requireView().findViewById(id)).getText().toString();
    }
}
