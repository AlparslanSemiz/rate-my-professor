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

import com.example.myapplication_java.Adapters.ProfessorAdapter;
import com.example.myapplication_java.Adapters.SearchPagerAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.Fragments.SelectionFragment;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.ServerCommunication.LoginRequest;
import com.example.myapplication_java.ServerCommunication.ServerResponse;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.Request;
import okio.Timeout;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@RunWith(AndroidJUnit4.class)
public class ProfessorFeatureInstrumentedTest {
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
    public void professorAdapterBindsFullNameAndItemCount() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ArrayList<Professor> professors = new ArrayList<>();
        professors.add(new Professor("prof-1", "Ada", "Lovelace", "Informatik", 4.5f));
        professors.add(new Professor("prof-2", "Grace", "Hopper", "Informatik", 4.8f));
        ProfessorAdapter adapter = new ProfessorAdapter(professors);
        ViewGroup parent = new FrameLayout(context);

        ProfessorAdapter.ProfessorViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 1);

        TextView nameView = holder.itemView.findViewById(R.id.profName);
        assertEquals(2, adapter.getItemCount());
        assertEquals("Grace Hopper", nameView.getText().toString());
    }

    @Test
    public void searchPagerAdapterCreatesProfessorPage() {
        SearchPagerAdapter adapter = new SearchPagerAdapter(new Fragment());

        Fragment fragment = adapter.createFragment(0);

        assertEquals(2, adapter.getItemCount());
        assertTrue(fragment instanceof SelectionFragment);
        assertEquals("PROFESSORS", fragment.requireArguments().getString("selection_type"));
    }

    @Test
    public void searchServiceReturnsProfessorsMatchingFirstNameOrderedByFirstName() {
        searchService.insertProfessor(new Professor("prof-2", "Grace", "Hopper", "Informatik", 4.8f));
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", "Informatik", 4.5f));
        searchService.insertProfessor(new Professor("prof-3", "Alan", "Turing", "Informatik", 4.9f));

        List<Professor> results = searchService.searchProfessors("A");

        assertEquals(2, results.size());
        assertEquals("Ada", results.get(0).firstName);
        assertEquals("Alan", results.get(1).firstName);
    }

    @Test
    public void updateDBReplacesExistingProfessorsWithServerProfessors() throws Exception {
        searchService.insertProfessor(new Professor("old-prof", "Old", "Professor", "Mathematik", 1.0f));
        APIService apiService = new FakeAPIService(
                Arrays.asList(
                        new Professor("prof-2", "Grace", "Hopper", "Informatik", 4.8f),
                        new Professor("prof-1", "Ada", "Lovelace", "Informatik", 4.5f)
                ),
                Collections.emptyList()
        );

        database.updateDB(apiService);

        List<Professor> results = waitForProfessorCount(2);
        assertEquals("Ada", results.get(0).firstName);
        assertEquals("Grace", results.get(1).firstName);
    }

    private List<Professor> waitForProfessorCount(int expectedCount) throws InterruptedException {
        long deadline = System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(3);
        List<Professor> results = Collections.emptyList();

        while (System.currentTimeMillis() < deadline) {
            results = searchService.searchProfessors("");
            if (results.size() == expectedCount) {
                return results;
            }
            Thread.sleep(50);
        }

        return results;
    }

    private static class FakeAPIService implements APIService {
        private final List<Professor> professors;
        private final List<Lecture> lectures;

        FakeAPIService(List<Professor> professors, List<Lecture> lectures) {
            this.professors = professors;
            this.lectures = lectures;
        }

        @Override
        public Call<ServerResponse> requestLogin(LoginRequest request) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Call<ServerResponse> login(LoginRequest request) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Call<List<Professor>> getProfessors() {
            return new SuccessfulCall<>(professors);
        }

        @Override
        public Call<List<Lecture>> getLectures() {
            return new SuccessfulCall<>(lectures);
        }
    }

    private static class SuccessfulCall<T> implements Call<T> {
        private final T body;
        private boolean executed;
        private boolean canceled;

        SuccessfulCall(T body) {
            this.body = body;
        }

        @Override
        public Response<T> execute() throws IOException {
            executed = true;
            return Response.success(body);
        }

        @Override
        public void enqueue(Callback<T> callback) {
            executed = true;
            callback.onResponse(this, Response.success(body));
        }

        @Override
        public boolean isExecuted() {
            return executed;
        }

        @Override
        public void cancel() {
            canceled = true;
        }

        @Override
        public boolean isCanceled() {
            return canceled;
        }

        @Override
        public Call<T> clone() {
            return new SuccessfulCall<>(body);
        }

        @Override
        public Request request() {
            return new Request.Builder()
                    .url("https://example.test/")
                    .build();
        }

        @Override
        public Timeout timeout() {
            return Timeout.NONE;
        }
    }
}
