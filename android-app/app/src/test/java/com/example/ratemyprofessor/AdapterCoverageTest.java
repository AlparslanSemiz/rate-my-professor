package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import android.content.Context;
import android.graphics.Typeface;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.fragment.app.Fragment;

import com.example.ratemyprofessor.adapters.CommentsAdapter;
import com.example.ratemyprofessor.adapters.LectureAdapter;
import com.example.ratemyprofessor.adapters.ListOfMyRatingsAdapter;
import com.example.ratemyprofessor.adapters.NotificationAdapter;
import com.example.ratemyprofessor.adapters.ProfileLectureAdapter;
import com.example.ratemyprofessor.adapters.ProfileProfessorAdapter;
import com.example.ratemyprofessor.adapters.ProfileSemesterAdapter;
import com.example.ratemyprofessor.adapters.ProfessorAdapter;
import com.example.ratemyprofessor.adapters.RatingAdapter;
import com.example.ratemyprofessor.adapters.SearchPagerAdapter;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Notification;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.SelectionType;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.fragments.SelectionFragment;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.responses.AuthState;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationType;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorShortResponse;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingDto;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(RobolectricTestRunner.class)
public class AdapterCoverageTest {

    private Context context;
    private FrameLayout parent;

    @Before
    public void setUp() {
        context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        parent = new FrameLayout(context);
    }

    @After
    public void resetAuth() {
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
    }

    @Test
    public void professorAndLectureAdaptersBindClickAndReplaceData() {
        Professor professor = TestSupport.professor("p1");
        AtomicReference<Professor> pickedProfessor = new AtomicReference<>();
        ProfessorAdapter professors = new ProfessorAdapter(
                new ArrayList<>(Collections.singletonList(professor)), pickedProfessor::set);
        ProfessorAdapter.ProfessorViewHolder professorHolder = professors.onCreateViewHolder(parent, 0);
        professors.onBindViewHolder(professorHolder, 0);
        assertEquals("Ada Lovelace", ((TextView) professorHolder.itemView.findViewById(R.id.profName)).getText().toString());
        professorHolder.itemView.performClick();
        assertSame(professor, pickedProfessor.get());
        professors.setData(Collections.singletonList(new Professor("p2", "Grace", "Hopper", 4, 1)));
        assertEquals(1, professors.getItemCount());

        Lecture lecture = TestSupport.lecture("l1");
        AtomicReference<String> pickedLecture = new AtomicReference<>();
        LectureAdapter lectures = new LectureAdapter(
                new ArrayList<>(Collections.singletonList(lecture)), pickedLecture::set);
        LectureAdapter.LectureViewHolder lectureHolder = lectures.onCreateViewHolder(parent, 0);
        lectures.onBindViewHolder(lectureHolder, 0);
        assertEquals("Algorithms", ((TextView) lectureHolder.itemView.findViewById(R.id.semester_name)).getText().toString());
        lectureHolder.itemView.performClick();
        assertEquals("Algorithms", pickedLecture.get());
        lectures.setData(Collections.emptyList());
        assertEquals(0, lectures.getItemCount());
    }

    @Test
    public void profileAdaptersBindSelectionAndForwardClicks() {
        Professor first = TestSupport.professor("p1");
        Professor second = new Professor("p2", "Grace", "Hopper", 4.2f, 2);
        AtomicReference<Professor> professorClick = new AtomicReference<>();
        ProfileProfessorAdapter professors = new ProfileProfessorAdapter(
                Arrays.asList(first, second), professorClick::set);
        ProfileProfessorAdapter.ProfessorViewHolder professorHolder = professors.onCreateViewHolder(parent, 0);
        professors.onBindViewHolder(professorHolder, 0);
        assertTrue(professorHolder.itemView.isSelected());
        professorHolder.itemView.performClick();
        assertSame(first, professorClick.get());
        professors.onBindViewHolder(professorHolder, 1);
        professorHolder.itemView.performClick();
        assertSame(second, professorClick.get());
        assertEquals(2, professors.getItemCount());

        AtomicReference<String> lectureClick = new AtomicReference<>();
        ProfileLectureAdapter lectures = new ProfileLectureAdapter(
                Arrays.asList("Algorithms", "Databases"), lectureClick::set);
        ProfileLectureAdapter.LectureViewHolder lectureHolder = lectures.onCreateViewHolder(parent, 0);
        lectures.onBindViewHolder(lectureHolder, 0);
        assertTrue(lectureHolder.itemView.isSelected());
        lectureHolder.itemView.performClick();
        lectures.onBindViewHolder(lectureHolder, 1);
        lectureHolder.itemView.performClick();
        assertEquals("Databases", lectureClick.get());
        assertEquals(2, lectures.getItemCount());

        Semester semester = new Semester(2026, SemesterSeason.WS);
        AtomicReference<Semester> semesterClick = new AtomicReference<>();
        ProfileSemesterAdapter semesters = new ProfileSemesterAdapter(
                context,
                Collections.singletonList(semester),
                Collections.singletonList(TestSupport.lecture("l1")),
                semesterClick::set);
        ProfileSemesterAdapter.SemesterViewHolder semesterHolder = semesters.onCreateViewHolder(parent, 0);
        semesters.onBindViewHolder(semesterHolder, 0);
        assertEquals("WS 2026", ((TextView) semesterHolder.itemView.findViewById(R.id.lecture_name_for_profile)).getText().toString());
        assertEquals("3.5", ((TextView) semesterHolder.itemView.findViewById(R.id.averageRatingBackground)).getText().toString());
        semesterHolder.itemView.performClick();
        assertSame(semester, semesterClick.get());
        assertEquals(1, semesters.getItemCount());
    }

    @Test
    public void ratingAdapterBindsBothBarsAndTracksChanges() {
        ArrayList<TopicAverageResponse> averages = new ArrayList<>(Arrays.asList(
                new TopicAverageResponse(RatingCategory.ROOM, 4.5),
                new TopicAverageResponse(RatingCategory.ORGANIZATION, 3.0)));
        ArrayList<TopicAverageResponse> own = new ArrayList<>(Arrays.asList(
                new TopicAverageResponse(RatingCategory.ROOM, 2.5),
                new TopicAverageResponse(RatingCategory.ORGANIZATION, 4.0)));
        RatingAdapter adapter = new RatingAdapter(averages, own);
        RatingAdapter.RatingViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 0);

        assertEquals("Room", ((TextView) holder.itemView.findViewById(R.id.category_name)).getText().toString());
        assertEquals("4.5", ((TextView) holder.itemView.findViewById(R.id.average_rating_num)).getText().toString());
        assertEquals("2.5", ((TextView) holder.itemView.findViewById(R.id.your_rating_num)).getText().toString());
        assertEquals(4.5f, ((RatingBar) holder.itemView.findViewById(R.id.ratingBar_average)).getRating(), 0.01f);
        assertEquals(2, adapter.getItemCount());
        assertSame(averages, adapter.getRatings());
        assertEquals(2.5, adapter.getChangedRatings().get(RatingCategory.ROOM), 0.01);
        adapter.onRatingChanged(RatingCategory.ROOM, 5.0);
        adapter.onRatingChanged(null, 1.0);
        assertEquals(5.0, adapter.getChangedRatings().get(RatingCategory.ROOM), 0.01);

        RatingAdapter averagesOnly = new RatingAdapter(averages, null);
        RatingAdapter.RatingViewHolder secondHolder = averagesOnly.onCreateViewHolder(parent, 0);
        averagesOnly.onBindViewHolder(secondHolder, 1);
        assertEquals("Organization", ((TextView) secondHolder.itemView.findViewById(R.id.category_name)).getText().toString());
    }

    @Test
    public void commentsAdapterCoversCommentReplyVotesReportsAndAuthGuard() {
        Comment reply = comment("r1", VoteType.DOWN, Collections.emptyList());
        Comment comment = comment("c1", VoteType.UP, Collections.singletonList(reply));
        CommentsAdapter.OnCommentClickListener listener = mock(CommentsAdapter.OnCommentClickListener.class);
        CommentsAdapter adapter = new CommentsAdapter(context,
                new ArrayList<>(Collections.singletonList(comment)), listener, CommentType.COMMENT);
        CommentsAdapter.CommentViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 0);
        assertEquals(1, adapter.getItemCount());
        assertEquals("User", ((TextView) holder.itemView.findViewById(R.id.user_name)).getText().toString());
        assertEquals("1", ((TextView) holder.itemView.findViewById(R.id.comments_num)).getText().toString());
        holder.itemView.performClick();
        holder.itemView.findViewById(R.id.comments_icon).performClick();
        holder.itemView.findViewById(R.id.report_button).performClick();
        verify(listener, org.mockito.Mockito.times(2)).onOpenReplies(comment);
        verify(listener).reportComment("c1");

        AuthManager.getInstance().setAuthState(AuthState.LOGGED_OUT);
        holder.itemView.findViewById(R.id.upvote_icon).performClick();
        AuthManager.getInstance().setAuthState(AuthState.LOGGED_IN);
        holder.itemView.findViewById(R.id.upvote_icon).performClick();
        holder.itemView.findViewById(R.id.downvote_icon).performClick();
        verify(listener).vote("c1", VoteType.NONE, CommentType.COMMENT);
        verify(listener).vote("c1", VoteType.DOWN, CommentType.COMMENT);

        CommentsAdapter replies = new CommentsAdapter(context,
                new ArrayList<>(Collections.singletonList(reply)), listener, CommentType.REPLY);
        CommentsAdapter.CommentViewHolder replyHolder = replies.onCreateViewHolder(parent, 0);
        replies.onBindViewHolder(replyHolder, 0);
        assertEquals(View.INVISIBLE, replyHolder.itemView.findViewById(R.id.comments_icon).getVisibility());
        assertEquals(View.GONE, replyHolder.itemView.findViewById(R.id.comments_num).getVisibility());
        replyHolder.itemView.findViewById(R.id.report_button).performClick();
        verify(listener).reportReply("r1");
    }

    @Test
    public void notificationAdapterBindsAllStatesAndNotifiesMatchingRow() {
        Notification reply = new Notification("n1", NotificationType.ANSWER.name(), new Date(0), false,
                "Ada", "preview", "Algorithms", "l1", "c1", "r1");
        Notification warning = new Notification("n2", NotificationType.WARNING.name(), null, true,
                "Warning", "warning", "", "", "", "");
        NotificationAdapter.OnNotificationClickListener listener = mock(NotificationAdapter.OnNotificationClickListener.class);
        NotificationAdapter adapter = new NotificationAdapter(Arrays.asList(reply, warning), listener);
        NotificationAdapter.NotificationViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 0);
        assertEquals(View.VISIBLE, holder.itemView.findViewById(R.id.unread_indicator).getVisibility());
        assertEquals(Typeface.BOLD, ((TextView) holder.itemView.findViewById(R.id.notification_title)).getTypeface().getStyle());
        holder.itemView.performClick();
        verify(listener).onNotificationClick(reply);

        adapter.onBindViewHolder(holder, 1);
        assertEquals(View.INVISIBLE, holder.itemView.findViewById(R.id.unread_indicator).getVisibility());
        assertEquals("", ((TextView) holder.itemView.findViewById(R.id.notification_date)).getText().toString());
        assertEquals(2, adapter.getItemCount());

        androidx.recyclerview.widget.RecyclerView.AdapterDataObserver observer =
                mock(androidx.recyclerview.widget.RecyclerView.AdapterDataObserver.class);
        adapter.registerAdapterDataObserver(observer);
        adapter.notifyNotificationChanged("n1");
        adapter.notifyNotificationChanged("missing");
        verify(observer).onItemRangeChanged(0, 1, null);
    }

    @Test
    public void ownRatingsAndPagerAdaptersCoverCreationAndClicks() {
        ProfessorShortResponse professor = new ProfessorShortResponse("p1", "Ada", "Lovelace", true);
        LectureResponse lecture = new LectureResponse("l1", "Algorithms", "CS101", 2026,
                SemesterSeason.WS, "WS 2026", "Algorithms", true, null,
                Collections.singletonList(professor), 1, 1, 4.25);
        AtomicReference<Semester> clicked = new AtomicReference<>();
        ListOfMyRatingsAdapter ratings = new ListOfMyRatingsAdapter(
                Collections.singletonList(new UserRatingDto(lecture, 4.25)),
                (semester, professorId, lectureName) -> clicked.set(semester));
        ListOfMyRatingsAdapter.UserRatingViewHolder holder = ratings.onCreateViewHolder(parent, 0);
        ratings.onBindViewHolder(holder, 0);
        assertEquals("4.3", ((TextView) holder.itemView.findViewById(R.id.averageRatingGiven)).getText().toString());
        assertEquals("Algorithms", ((TextView) holder.itemView.findViewById(R.id.lecture_name)).getText().toString());
        holder.itemView.performClick();
        assertEquals(new Semester(2026, SemesterSeason.WS), clicked.get());
        assertEquals(1, ratings.getItemCount());

        try (TestSupport backend = new TestSupport()) {
            com.example.ratemyprofessor.activities.MainActivity activity = backend.launchMainActivity();
            Fragment host = activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container);
            SearchPagerAdapter pager = new SearchPagerAdapter(host, () -> { });
            assertEquals(SelectionType.values().length, pager.getItemCount());
            SelectionFragment first = (SelectionFragment) pager.createFragment(0);
            SelectionFragment last = (SelectionFragment) pager.createFragment(999);
            assertEquals(SelectionType.PROFESSORS.name(), first.requireArguments().getString("selection_type"));
            assertEquals(SelectionType.LECTURES.name(), last.requireArguments().getString("selection_type"));
            assertTrue(pager.createFragment(-1) instanceof SelectionFragment);
        }
    }

    private static Comment comment(String id, VoteType vote, List<Comment> answers) {
        return new Comment(id, "Content", null, "User", "l1", null,
                LocalDateTime.of(2026, 1, 2, 3, 4), 2, 5, vote, answers);
    }
}
