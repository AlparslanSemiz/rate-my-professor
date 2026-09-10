package com.example.ratemyprofessor;

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

import com.example.ratemyprofessor.Adapters.LectureAdapter;
import com.example.ratemyprofessor.Adapters.SearchPagerAdapter;
import com.example.ratemyprofessor.Adapters.SearchService;
import com.example.ratemyprofessor.DomainModel.Lecture;
import com.example.ratemyprofessor.DomainModel.Professor;
import com.example.ratemyprofessor.DomainModel.SemesterSeason;
import com.example.ratemyprofessor.Fragments.SelectionFragment;
import com.example.ratemyprofessor.ServerCommunication.Database;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.ArrayList;
import java.util.List;

/**
 *  tests the search functionality of the search screen.
 */
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
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10));
        searchService.insertProfessor(new Professor("prof-2", "Grace", "Hopper", 4.8f, 20));

        List<Professor> results = searchService.searchProfessors("Alan");

        assertTrue(results.isEmpty());
    }

    @Test
    public void searchServiceReturnsAllProfessorsOrderedByLastNameForBlankQuery() {
        searchService.insertProfessor(new Professor("prof-3", "Grace", "Hopper", 4.8f, 20));
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10));
        searchService.insertProfessor(new Professor("prof-2", "Alan", "Turing", 4.9f, 30));

        List<Professor> results = searchService.searchProfessors("");

        assertEquals(3, results.size());
        // Ordered by last name: Hopper (Grace), Lovelace (Ada), Turing (Alan)
        assertEquals("Grace", results.get(0).firstName);
        assertEquals("Ada", results.get(1).firstName);
        assertEquals("Alan", results.get(2).firstName);
    }

    @Test
    public void deleteProfessorsClearsProfessorTable() {
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10));
        searchService.insertProfessor(new Professor("prof-2", "Grace", "Hopper", 4.8f, 20));

        searchService.deleteProfessors();

        assertTrue(searchService.searchProfessors("").isEmpty());
    }

    @Test
    public void searchServiceReturnsLecturesMatchingNameOrderedByName() {
        searchService.insertLecture(new Lecture("lecture-2", "Softwaretechnik", "240002", 2024, SemesterSeason.SS, true, 0, 0, 0));
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, 0, 0, 0));
        searchService.insertLecture(new Lecture("lecture-3", "Analysis", "240003", 2024, SemesterSeason.SS, true, 0, 0, 0));

        // Query "A" matches Algorithms, Analysis, AND Softwaretechnik (contains 'a')
        List<Lecture> results = searchService.searchLectures("A");

        assertEquals(3, results.size());
        assertEquals("Algorithms", results.get(0).name);
        assertEquals("Analysis", results.get(1).name);
        assertEquals("Softwaretechnik", results.get(2).name);
    }

    @Test
    public void searchServiceReturnsEmptyLectureListWhenNameDoesNotMatch() {
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, 0, 0, 0));
        searchService.insertLecture(new Lecture("lecture-2", "Softwaretechnik", "240002", 2024, SemesterSeason.SS, true, 0, 0, 0));

        List<Lecture> results = searchService.searchLectures("Physics");

        assertTrue(results.isEmpty());
    }

    @Test
    public void searchServiceReturnsAllLecturesOrderedByNameForBlankQuery() {
        searchService.insertLecture(new Lecture("lecture-3", "Softwaretechnik", "240002", 2024, SemesterSeason.SS, true, 0, 0, 0));
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, 0, 0, 0));
        searchService.insertLecture(new Lecture("lecture-2", "Analysis", "240003", 2024, SemesterSeason.SS, true, 0, 0, 0));

        List<Lecture> results = searchService.searchLectures("");

        assertEquals(3, results.size());
        assertEquals("Algorithms", results.get(0).name);
        assertEquals("Analysis", results.get(1).name);
        assertEquals("Softwaretechnik", results.get(2).name);
    }

    @Test
    public void deleteLecturesClearsLectureTable() {
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, 0, 0, 0));
        searchService.insertLecture(new Lecture("lecture-2", "Softwaretechnik", "240002", 2024, SemesterSeason.SS, true, 0, 0, 0));

        searchService.deleteLectures();

        assertTrue(searchService.searchLectures("").isEmpty());
    }

    @Test
    public void lectureAdapterBindsLectureNameAndItemCount() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ArrayList<Lecture> lectures = new ArrayList<>();
        lectures.add(new Lecture("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, 0, 0, 0));
        lectures.add(new Lecture("lecture-2", "Softwaretechnik", "240002", 2024, SemesterSeason.SS, true, 0, 0, 0));
        LectureAdapter adapter = new LectureAdapter(lectures, name -> {});
        ViewGroup parent = new FrameLayout(context);

        LectureAdapter.LectureViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 1);

        // item_lecture_name.xml names its TextView semester_name, not profName like the
        // professor row does.
        TextView nameView = holder.itemView.findViewById(R.id.semester_name);
        assertEquals(2, adapter.getItemCount());
        assertEquals("Softwaretechnik", nameView.getText().toString());
    }

    @Test
    public void lectureAdapterReportsZeroItemsForEmptyList() {
        LectureAdapter adapter = new LectureAdapter(new ArrayList<>(), name -> {});

        assertEquals(0, adapter.getItemCount());
    }

    @Test
    public void searchPagerAdapterCreatesLecturePage() {
        try (androidx.test.core.app.ActivityScenario<com.example.ratemyprofessor.Activities.MainActivity> scenario =
                     androidx.test.core.app.ActivityScenario.launch(com.example.ratemyprofessor.Activities.MainActivity.class)) {
            scenario.onActivity(activity -> {
                Fragment host = activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container);
                SearchPagerAdapter adapter = new SearchPagerAdapter(host, () -> {});

                Fragment fragment = adapter.createFragment(1);

                assertEquals(2, adapter.getItemCount());
                assertTrue(fragment instanceof SelectionFragment);
                assertEquals("LECTURES", fragment.requireArguments().getString("selection_type"));
            });
        }
    }

    @Test
    public void searchPagerAdapterTreatsUnknownPositionAsLecturePage() {
        try (androidx.test.core.app.ActivityScenario<com.example.ratemyprofessor.Activities.MainActivity> scenario =
                     androidx.test.core.app.ActivityScenario.launch(com.example.ratemyprofessor.Activities.MainActivity.class)) {
            scenario.onActivity(activity -> {
                Fragment host = activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container);
                SearchPagerAdapter adapter = new SearchPagerAdapter(host, () -> {});

                Fragment fragment = adapter.createFragment(99);

                assertTrue(fragment instanceof SelectionFragment);
                assertEquals("LECTURES", fragment.requireArguments().getString("selection_type"));
            });
        }
    }
}
