package com.example.ratemyprofessor;

import static org.junit.Assert.assertEquals;

import android.content.Context;

import com.example.ratemyprofessor.Adapters.CommentsAdapter;
import com.example.ratemyprofessor.Adapters.LectureAdapter;
import com.example.ratemyprofessor.Adapters.ListOfMyRatingsAdapter;
import com.example.ratemyprofessor.Adapters.NotificationAdapter;
import com.example.ratemyprofessor.Adapters.ProfessorAdapter;
import com.example.ratemyprofessor.Adapters.RatingAdapter;
import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.Lecture;
import com.example.ratemyprofessor.DomainModel.Notification;
import com.example.ratemyprofessor.DomainModel.Professor;
import com.example.ratemyprofessor.DomainModel.RatingCategory;
import com.example.ratemyprofessor.ServerCommunication.Responses.TopicAverageResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.UserRatingDto;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@RunWith(RobolectricTestRunner.class)
public class AdapterLogicTest {

    @Test
    public void professorAdapterReturnsCorrectItemCount() {
        List<Professor> list = new ArrayList<>();
        ProfessorAdapter adapter = new ProfessorAdapter(list, p -> {});
        assertEquals(0, adapter.getItemCount());

        list.add(new Professor("1", "A", "B", 4.0f, 1));
        assertEquals(1, adapter.getItemCount());
    }

    @Test
    public void lectureAdapterReturnsCorrectItemCount() {
        List<Lecture> list = new ArrayList<>();
        LectureAdapter adapter = new LectureAdapter(list, l -> {});
        assertEquals(0, adapter.getItemCount());

        list.add(new Lecture("1", "L", "C", 2024, null, true, 0, 0));
        assertEquals(1, adapter.getItemCount());
    }

    @Test
    public void commentsAdapterReturnsCorrectItemCount() {
        Context context = RuntimeEnvironment.getApplication();
        List<Comment> list = new ArrayList<>();
        CommentsAdapter adapter = new CommentsAdapter(context, list, null, CommentType.COMMENT);
        assertEquals(0, adapter.getItemCount());

        list.add(new Comment("1", "C", null, "U", "L", "P", null, 0, 0, Collections.emptyList()));
        assertEquals(1, adapter.getItemCount());
    }

    @Test
    public void ratingAdapterReturnsCorrectItemCount() {
        List<TopicAverageResponse> list = new ArrayList<>();
        RatingAdapter adapter = new RatingAdapter(list, null);
        assertEquals(0, adapter.getItemCount());

        list.add(new TopicAverageResponse(RatingCategory.ROOM, 4.5));
        assertEquals(1, adapter.getItemCount());
    }

    @Test
    public void notificationAdapterReturnsCorrectItemCount() {
        List<Notification> list = new ArrayList<>();
        NotificationAdapter adapter = new NotificationAdapter(list, n -> {});
        assertEquals(0, adapter.getItemCount());

        list.add(new Notification("1", "M", new Date(), false));
        assertEquals(1, adapter.getItemCount());
    }

    @Test
    public void listOfMyRatingsAdapterReturnsCorrectItemCount() {
        List<UserRatingDto> list = new ArrayList<>();
        ListOfMyRatingsAdapter adapter = new ListOfMyRatingsAdapter(list, (s, p, l) -> {});
        assertEquals(0, adapter.getItemCount());

        list.add(new UserRatingDto(null, 4.0));
        assertEquals(1, adapter.getItemCount());
    }
}
