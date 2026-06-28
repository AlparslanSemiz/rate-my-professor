package com.example.myapplication_java;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.fragment.app.Fragment;
import androidx.room.Room;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.example.myapplication_java.Adapters.LectureAdapter;
import com.example.myapplication_java.Adapters.SearchPagerAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.Fragments.SelectionFragment;
import com.example.myapplication_java.ServerCommunication.Database;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;

@RunWith(AndroidJUnit4.class)
public class SearchAndFilterInstrumentedTest {
    private Database database;
    private SearchService searchService;

    @Before
    public void setUp() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        database = Room.inMemoryDatabaseBuilder(context, Database.class)
                .allowMainThreadQueries()
                .build();
        searchService = database.searchService();
    }

    @After
    public void tearDown() {
        database.close();
    }

    @Test
    public void searchServiceReturnsEmptyProfessorListWhenFirstNameDoesNotMatch() {
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", "Informatik", 4.5f));
        searchService.insertProfessor(new Professor("prof-2", "Grace", "Hopper", "Informatik", 4.8f));

        List<Professor> results = searchService.searchProfessors("Alan");

        assertTrue(results.isEmpty());
    }

    @Test
    public void searchServiceReturnsAllProfessorsOrderedByFirstNameForBlankQuery() {
        searchService.insertProfessor(new Professor("prof-3", "Grace", "Hopper", "Informatik", 4.8f));
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", "Informatik", 4.5f));
        searchService.insertProfessor(new Professor("prof-2", "Alan", "Turing", "Informatik", 4.9f));

        List<Professor> results = searchService.searchProfessors("");

        assertEquals(3, results.size());
        assertEquals("Ada", results.get(0).firstName);
        assertEquals("Alan", results.get(1).firstName);
        assertEquals("Grace", results.get(2).firstName);
    }

    @Test
    public void deleteProfessorsClearsProfessorTable() {
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", "Informatik", 4.5f));
        searchService.insertProfessor(new Professor("prof-2", "Grace", "Hopper", "Informatik", 4.8f));

        searchService.deleteProfessors();

        assertTrue(searchService.searchProfessors("").isEmpty());
    }

    @Test
    public void searchServiceReturnsLecturesMatchingNameOrderedByName() {
        searchService.insertLecture(new Lecture("lecture-2", "Softwaretechnik", "240002"));
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001"));
        searchService.insertLecture(new Lecture("lecture-3", "Analysis", "240003"));

        List<Lecture> results = searchService.searchLectures("A");

        assertEquals(2, results.size());
        assertEquals("Algorithms", results.get(0).name);
        assertEquals("Analysis", results.get(1).name);
    }

    @Test
    public void searchServiceReturnsEmptyLectureListWhenNameDoesNotMatch() {
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001"));
        searchService.insertLecture(new Lecture("lecture-2", "Softwaretechnik", "240002"));

        List<Lecture> results = searchService.searchLectures("Physics");

        assertTrue(results.isEmpty());
    }

    @Test
    public void searchServiceReturnsAllLecturesOrderedByNameForBlankQuery() {
        searchService.insertLecture(new Lecture("lecture-3", "Softwaretechnik", "240002"));
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001"));
        searchService.insertLecture(new Lecture("lecture-2", "Analysis", "240003"));

        List<Lecture> results = searchService.searchLectures("");

        assertEquals(3, results.size());
        assertEquals("Algorithms", results.get(0).name);
        assertEquals("Analysis", results.get(1).name);
        assertEquals("Softwaretechnik", results.get(2).name);
    }

    @Test
    public void deleteLecturesClearsLectureTable() {
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001"));
        searchService.insertLecture(new Lecture("lecture-2", "Softwaretechnik", "240002"));

        searchService.deleteLectures();

        assertTrue(searchService.searchLectures("").isEmpty());
    }

    @Test
    public void lectureAdapterBindsLectureNameAndItemCount() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ArrayList<Lecture> lectures = new ArrayList<>();
        lectures.add(new Lecture("lecture-1", "Algorithms", "240001"));
        lectures.add(new Lecture("lecture-2", "Softwaretechnik", "240002"));
        LectureAdapter adapter = new LectureAdapter(lectures);
        ViewGroup parent = new FrameLayout(context);

        LectureAdapter.LectureViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 1);

        TextView nameView = holder.itemView.findViewById(R.id.lectureName);
        assertEquals(2, adapter.getItemCount());
        assertEquals("Softwaretechnik", nameView.getText().toString());
    }

    @Test
    public void lectureAdapterReportsZeroItemsForEmptyList() {
        LectureAdapter adapter = new LectureAdapter(new ArrayList<>());

        assertEquals(0, adapter.getItemCount());
    }

    @Test
    public void searchPagerAdapterCreatesLecturePage() {
        SearchPagerAdapter adapter = new SearchPagerAdapter(new Fragment());

        Fragment fragment = adapter.createFragment(1);

        assertEquals(2, adapter.getItemCount());
        assertTrue(fragment instanceof SelectionFragment);
        assertEquals("LECTURES", fragment.requireArguments().getString("selection_type"));
    }

    @Test
    public void searchPagerAdapterTreatsUnknownPositionAsLecturePage() {
        SearchPagerAdapter adapter = new SearchPagerAdapter(new Fragment());

        Fragment fragment = adapter.createFragment(99);

        assertTrue(fragment instanceof SelectionFragment);
        assertEquals("LECTURES", fragment.requireArguments().getString("selection_type"));
    }
}
