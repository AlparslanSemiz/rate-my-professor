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

import com.example.ratemyprofessor.adapters.ProfessorAdapter;
import com.example.ratemyprofessor.adapters.SearchPagerAdapter;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.LectureModel;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.fragments.SelectionFragment;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.requests.BugReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.CommentReportRequest;
import com.example.ratemyprofessor.servercommunication.requests.RatingRequest;
import com.example.ratemyprofessor.servercommunication.responses.BasicResponse;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.servercommunication.requests.LoginRequest;
import com.example.ratemyprofessor.servercommunication.requests.PostCommentRequest;
import com.example.ratemyprofessor.servercommunication.responses.LectureDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.LecturesResponse;
import com.example.ratemyprofessor.servercommunication.responses.NotificationsResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorsResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.example.ratemyprofessor.servercommunication.requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.servercommunication.responses.StudentProfileResponse;
import com.example.ratemyprofessor.servercommunication.requests.VoteRequest;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingResponse;

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
import okhttp3.ResponseBody;
import okio.Timeout;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Tests professor feature instrumented behavior.
 */
@RunWith(AndroidJUnit4.class)
public class ProfessorFeatureInstrumentedTest {
    private Database database;
    private SearchService searchService;

    /**
     * Initializes the fixtures required by each test.
     */
    @Before
    public void setUp() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        database = Room.inMemoryDatabaseBuilder(context, Database.class)
                .allowMainThreadQueries()
                .build();
        searchService = database.searchService();
    }

    /**
     * Releases the resources created for each test.
     */
    @After
    public void tearDown() {
        database.close();
    }

    /**
     * Verifies that professor adapter binds full name and item count.
     */
    @Test
    public void professorAdapterBindsFullNameAndItemCount() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        ArrayList<Professor> professors = new ArrayList<>();
        professors.add(new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10));
        professors.add(new Professor("prof-2", "Grace", "Hopper", 4.8f, 20));
        ProfessorAdapter adapter = new ProfessorAdapter(professors, prof -> {});
        ViewGroup parent = new FrameLayout(context);

        ProfessorAdapter.ProfessorViewHolder holder = adapter.onCreateViewHolder(parent, 0);
        adapter.onBindViewHolder(holder, 1);

        TextView nameView = holder.itemView.findViewById(R.id.profName);
        assertEquals(2, adapter.getItemCount());
        assertEquals("Grace Hopper", nameView.getText().toString());
    }

    /**
     * Verifies that professor adapter reports zero items for empty list.
     */
    @Test
    public void professorAdapterReportsZeroItemsForEmptyList() {
        ProfessorAdapter adapter = new ProfessorAdapter(new ArrayList<>(), prof -> {});

        assertEquals(0, adapter.getItemCount());
    }

    /**
     * Verifies that search pager adapter creates professor page.
     */
    @Test
    public void searchPagerAdapterCreatesProfessorPage() {
        // We use ActivityScenario to get a valid FragmentManager/Context
        try (androidx.test.core.app.ActivityScenario<com.example.ratemyprofessor.activities.MainActivity> scenario =
                     androidx.test.core.app.ActivityScenario.launch(com.example.ratemyprofessor.activities.MainActivity.class)) {
            scenario.onActivity(activity -> {
                Fragment host = activity.getSupportFragmentManager().findFragmentById(R.id.fragment_container);
                SearchPagerAdapter adapter = new SearchPagerAdapter(host, () -> {});

                Fragment createdFragment = adapter.createFragment(0);

                assertEquals(2, adapter.getItemCount());
                assertTrue(createdFragment instanceof SelectionFragment);
                assertEquals("PROFESSORS", createdFragment.requireArguments().getString("selection_type"));
            });
        }
    }

    /**
     * Verifies that search service returns professors matching first name ordered by last name.
     */
    @Test
    public void searchServiceReturnsProfessorsMatchingFirstNameOrderedByLastName() {
        searchService.insertProfessor(new Professor("prof-2", "Grace", "Hopper", 4.8f, 20));
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10));
        searchService.insertProfessor(new Professor("prof-3", "Alan", "Turing", 4.9f, 30));

        // Query "A" matches Ada, Alan, and GrAce. (3 items)
        List<Professor> results = searchService.searchProfessors("A");

        assertEquals(3, results.size());
        // Ordered by last name: Hopper (Grace), Lovelace (Ada), Turing (Alan)
        assertEquals("Grace", results.get(0).firstName);
        assertEquals("Ada", results.get(1).firstName);
        assertEquals("Alan", results.get(2).firstName);
    }

    /**
     * Verifies that replace lecture ratings replaces only the requested cache.
     */
    @Test
    public void replaceLectureRatingsReplacesOnlyTheRequestedCache() {
        searchService.upsertRating(new Rating(
                "lecture-1", RatingCategory.ROOM, 2.0, Rater.AVERAGE
        ));
        searchService.upsertRating(new Rating(
                "lecture-1", RatingCategory.ROOM, 4.0, Rater.USER
        ));

        searchService.replaceLectureRatings(
                "lecture-1",
                Rater.AVERAGE,
                Collections.singletonList(new Rating(
                        "lecture-1", RatingCategory.ORGANIZATION, 4.5, Rater.AVERAGE
                ))
        );

        List<Rating> averages = searchService.getLectureRatings("lecture-1", Rater.AVERAGE);
        List<Rating> userRatings = searchService.getLectureRatings("lecture-1", Rater.USER);
        assertEquals(1, averages.size());
        assertEquals(RatingCategory.ORGANIZATION, averages.get(0).category);
        assertEquals(4.5, averages.get(0).score, 0.001);
        assertEquals(1, userRatings.size());
        assertEquals(4.0, userRatings.get(0).score, 0.001);
    }

    /**
     * Verifies that a database refresh replaces cached professors with server data.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void updateDBReplacesExistingProfessorsWithServerProfessors() throws Exception {
        searchService.insertProfessor(new Professor("old-prof", "Old", "Professor", 1.0f, 1));
        APIService apiService = new FakeAPIService(
                Arrays.asList(
                        new Professor("prof-2", "Grace", "Hopper", 4.8f, 20),
                        new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10)
                ),
                Collections.emptyList()
        );

        database.updateDB(apiService);

        List<Professor> results = waitForProfessorCount(2);
        // Ordered by last name: Hopper (Grace), Lovelace (Ada)
        assertEquals("Grace", results.get(0).firstName);
        assertEquals("Ada", results.get(1).firstName);
    }

    /**
     * Verifies that a database refresh replaces cached lectures with server data.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void updateDBReplacesExistingLecturesWithServerLectures() throws Exception {
        searchService.insertLecture(new Lecture("old-lecture", "Old Lecture", "000000", 2023, SemesterSeason.WS, true, 0, 0, 0));
        APIService apiService = new FakeAPIService(
                Collections.emptyList(),
                Arrays.asList(
                        new LectureModel("lecture-2", "Softwaretechnik", "240002", 2024, SemesterSeason.SS, true, Collections.emptyList(), 0, 0, 0),
                        new LectureModel("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, Collections.emptyList(), 0, 0, 0)
                )
        );

        database.updateDB(apiService);

        List<Lecture> results = waitForLectureCount(2);
        // Ordered by name: Algorithms, Softwaretechnik
        assertEquals("Algorithms", results.get(0).name);
        assertEquals("Softwaretechnik", results.get(1).name);
    }

    /**
     * Verifies that null response bodies preserve cached data.
     */
    @Test
    public void updateDBLeavesExistingDataWhenServerBodiesAreNull() {
        searchService.insertProfessor(new Professor("prof-1", "Ada", "Lovelace", 4.5f, 10));
        searchService.insertLecture(new Lecture("lecture-1", "Algorithms", "240001", 2023, SemesterSeason.WS, true, 0, 0, 0));
        APIService apiService = new FakeAPIService(null, null);

        database.updateDB(apiService);

        assertEquals(1, searchService.searchProfessors("").size());
        assertEquals(1, searchService.searchLectures("").size());
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

    private List<Lecture> waitForLectureCount(int expectedCount) throws InterruptedException {
        long deadline = System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(3);
        List<Lecture> results = Collections.emptyList();

        while (System.currentTimeMillis() < deadline) {
            results = searchService.searchLectures("");
            if (results.size() == expectedCount) {
                return results;
            }
            Thread.sleep(50);
        }

        return results;
    }

    private static class FakeAPIService implements APIService {
        private final List<Professor> professors;
        private final List<LectureModel> lectures;

        /**
         * Creates a FakeAPIService with the supplied values.
         *
         * @param professors the professors to store or display
         * @param lectures the lecture offerings to store or display
         */
        FakeAPIService(List<Professor> professors, List<LectureModel> lectures) {
            this.professors = professors;
            this.lectures = lectures;
        }

        @Override
        public Call<ServerResponse> requestLogin(LoginRequest request) { return null; }
        @Override
        public Call<ServerResponse> login(LoginRequest request) { return null; }

        @Override
        public Call<ServerResponse> validate(String token, LoginRequest request) {
            return null;
        }

        @Override
        public Call<BasicResponse> logoutAllDevices(String token) {
            return null;
        }

        @Override
        public Call<BasicResponse> deleteAccount(String token) { return null; }

        @Override
        public Call<ProfessorsResponse> getProfessors() {
            ProfessorsResponse resp = new ProfessorsResponse("its ok", true, professors);
            return new SuccessfulCall<>(resp);
        }

        @Override
        public Call<ProfessorDetailResponse> getProfessor(String professorId) {
            return null;
        }

        @Override
        public Call<LecturesResponse> getLectures() {
            LecturesResponse resp = new LecturesResponse("its ok", true, lectures);
            return new SuccessfulCall<>(resp);
        }

        @Override
        public Call<LectureDetailResponse> getLecture(String lectureId) {
            return null;
        }

        @Override
        public Call<ServerResponse> postComment(String token, PostCommentRequest request) { return null; }

        @Override
        public Call<CommentsResponse> getComments(String token, String lectureId) {
            return null;
        }
        @Override
        public Call<RatingAverageResponse> getRatings(String lectureId) { return null; }

        @Override
        public Call<ServerResponse> submitRating(String token, RatingRequest request) {
            return null;
        }

        @Override
        public Call<BasicResponse> postAnswer(String token, SubmitAnswerRequest request) {
            return null;
        }

        @Override
        public Call<BasicResponse> voteComment(String token, String commentID, VoteRequest request) {
            return null;
        }

        @Override
        public Call<BasicResponse> voteAnswer(String token, String answerID, VoteRequest request) {
            return null;
        }

        @Override
        public Call<CommentsResponse> getAllComments() {
            return null;
        }

        @Override
        public Call<StudentProfileResponse> getUserInformation(String token) {
            return null;
        }

        @Override
        public Call<UserRatingResponse> getUserRatings(String token) {
            return null;
        }

        @Override
        public Call<BasicResponse> reportComment(String token, CommentReportRequest request) {
            return null;
        }

        @Override
        public Call<BasicResponse> reportReply(String token, CommentReportRequest request) {
            return null;
        }

        @Override
        public Call<ResponseBody> downloadImage(String url) {
            return null;
        }

        @Override
        public Call<NotificationsResponse> getNotifications(String token) {
            return null;
        }

        @Override
        public Call<BasicResponse> markNotificationsAsSeen(String token, String notificationId) {
            return null;
        }

        @Override
        public Call<RatingCategoriesResponse> getCategories(String lectureId) {
            return null;
        }

        @Override
        public Call<RatingAverageResponse> getOwnRatings(String token, String lectureId) {
            return null;
        }

        @Override
        public Call<BasicResponse> reportBug(String token, BugReportRequest request) {
            return null;
        }


    }

    private static class SuccessfulCall<T> implements Call<T> {
        private final T body;
        private boolean executed;
        private boolean canceled;

        /**
         * Creates a SuccessfulCall with the supplied values.
         *
         * @param body the response body returned by the test call
         */
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
        public boolean isExecuted() { return executed; }
        @Override
        public void cancel() { canceled = true; }
        @Override
        public boolean isCanceled() { return canceled; }
        @Override
        public Call<T> clone() { return new SuccessfulCall<>(body); }
        @Override
        public Request request() {
            return new Request.Builder().url("https://example.test/").build();
        }
        @Override
        public Timeout timeout() { return Timeout.NONE; }
    }
}
