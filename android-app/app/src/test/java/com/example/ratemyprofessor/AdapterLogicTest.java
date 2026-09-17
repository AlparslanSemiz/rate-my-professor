package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;

import android.content.Context;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.example.ratemyprofessor.adapters.CommentsAdapter;
import com.example.ratemyprofessor.adapters.LectureAdapter;
import com.example.ratemyprofessor.adapters.ListOfMyRatingsAdapter;
import com.example.ratemyprofessor.adapters.NotificationAdapter;
import com.example.ratemyprofessor.adapters.ProfessorAdapter;
import com.example.ratemyprofessor.adapters.RatingAdapter;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.LectureType;
import com.example.ratemyprofessor.domain.Notification;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorShortResponse;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingDto;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * tests the logic of different adapters in this project.
 */
@RunWith(RobolectricTestRunner.class)
public class AdapterLogicTest {

    /**
     * Verifies that professor adapter binds full name.
     */
    @Test
    public void professorAdapterBindsFullName() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        List<Professor> list = Collections.singletonList(
                new Professor("1", "Ada", "Lovelace", 4.5f, 10)
        );
        ProfessorAdapter adapter = new ProfessorAdapter(list, p -> {});
        
        ProfessorAdapter.ProfessorViewHolder holder = adapter.onCreateViewHolder(new FrameLayout(context), 0);
        adapter.onBindViewHolder(holder, 0);

        TextView nameView = holder.itemView.findViewById(R.id.profName);
        assertEquals("Ada Lovelace", nameView.getText().toString());
    }

    /**
     * Verifies that lecture adapter returns correct item count.
     */
    @Test
    public void lectureAdapterReturnsCorrectItemCount() {
        List<Lecture> list = new ArrayList<>();
        LectureAdapter adapter = new LectureAdapter(list, l -> {});
        assertEquals(0, adapter.getItemCount());

        list.add(new Lecture("1", "L", "C", 2024, SemesterSeason.WS, true, 0, 0, 0));
        assertEquals(1, adapter.getItemCount());
    }

    /**
     * Verifies that notification adapter shows unread indicator.
     */
    @Test
    public void notificationAdapterShowsUnreadIndicator() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        Notification notification = new Notification("1", "Msg", new Date(), false);
        notification.actorUsername = "UserA";
        
        NotificationAdapter adapter = new NotificationAdapter(Collections.singletonList(notification), n -> {});
        NotificationAdapter.NotificationViewHolder holder = adapter.onCreateViewHolder(new FrameLayout(context), 0);
        adapter.onBindViewHolder(holder, 0);

        View indicator = holder.itemView.findViewById(R.id.unread_indicator);
        assertEquals(View.VISIBLE, indicator.getVisibility());

        // Now test read state
        notification.markAsRead();
        adapter.onBindViewHolder(holder, 0);
        assertEquals(View.INVISIBLE, indicator.getVisibility());
    }

    /**
     * Verifies that comments adapter binds content.
     */
    @Test
    public void commentsAdapterBindsContent() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        Comment comment = new Comment("1", "ContentA", null, "UserB", "L1", null, LocalDateTime.now(), 2, 5,VoteType.UP , Collections.emptyList());
        
        CommentsAdapter adapter = new CommentsAdapter(context, Collections.singletonList(comment), null, CommentType.COMMENT);
        CommentsAdapter.CommentViewHolder holder = adapter.onCreateViewHolder(new FrameLayout(context), 0);
        adapter.onBindViewHolder(holder, 0);

        TextView userView = holder.itemView.findViewById(R.id.user_name);
        TextView contentView = holder.itemView.findViewById(R.id.content_text);
        TextView upvoteView = holder.itemView.findViewById(R.id.upvotes_num);

        assertEquals("UserB", userView.getText().toString());
        assertEquals("ContentA", contentView.getText().toString());
        assertEquals("5", upvoteView.getText().toString());
    }

    /**
     * Verifies that list of my ratings adapter formats semester.
     */
    @Test
    public void listOfMyRatingsAdapterFormatsSemester() {
        Context context = RuntimeEnvironment.getApplication();
        context.setTheme(R.style.Theme_RateMyProfessor);
        ProfessorShortResponse prof = new ProfessorShortResponse("p1", "First", "Last", true);
        LectureResponse lecture = new LectureResponse("l1", "NameA", "c1", 2024, SemesterSeason.SS, "", "title",true, LectureType.LECTURE_ONLY, Collections.singletonList(prof), 0, 0, 3.5);
        UserRatingDto rating = new UserRatingDto(lecture, 4.0);
        
        ListOfMyRatingsAdapter adapter = new ListOfMyRatingsAdapter(Collections.singletonList(rating), (s, p, l) -> {});
        ListOfMyRatingsAdapter.UserRatingViewHolder holder = adapter.onCreateViewHolder(new FrameLayout(context), 0);
        adapter.onBindViewHolder(holder, 0);

        TextView semesterView = holder.itemView.findViewById(R.id.semester);
        // R.string.semester is "%1$s %2$d" (Season Year)
        String expected = "SS 2024"; 
        assertEquals(expected, semesterView.getText().toString());
    }

    /**
     * Verifies that rating adapter returns correct item count.
     */
    @Test
    public void ratingAdapterReturnsCorrectItemCount() {
        ArrayList<TopicAverageResponse> list = new ArrayList<>();
        RatingAdapter adapter = new RatingAdapter(list, null);
        assertEquals(0, adapter.getItemCount());

        list.add(new TopicAverageResponse(RatingCategory.ROOM, 4.5));
        assertEquals(1, adapter.getItemCount());
    }
}
