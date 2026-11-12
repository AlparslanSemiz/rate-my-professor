package com.example.ratemyprofessor.servercommunication;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import androidx.room.InvalidationTracker;
import androidx.room.RoomOpenDelegate;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;

import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.CommentModel;
import com.example.ratemyprofessor.domain.Instructor;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.LectureModel;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.SemesterSeason;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.ContentStatus;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.responses.LecturesResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorsResponse;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.AbstractExecutorService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;

import okhttp3.Request;
import okhttp3.ResponseBody;
import okio.Timeout;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * tests if the app takes complex, nested data from th server and parses and stores it correctly.
 */
@RunWith(RobolectricTestRunner.class)
public class DatabaseSyncTest {

    /**
     * Verifies that get instance returns an existing singleton.
     *
     * @throws Exception if the operation cannot complete
     */
    @Test
    public void getInstanceReturnsAnExistingSingleton() throws Exception {
        Field instanceField = Database.class.getDeclaredField("instance");
        instanceField.setAccessible(true);
        Database previousInstance = (Database) instanceField.get(null);
        TestDatabase expected = new TestDatabase(new RecordingSearchService());

        try {
            instanceField.set(null, expected);

            assertSame(expected, Database.getInstance(null));
            assertSame(expected, Database.getInstance(null));
        } finally {
            instanceField.set(null, previousInstance);
        }
    }

    /**
     * Verifies that successful refresh responses are written through the data access object.
     */
    @Test
    public void updateDBRefreshesSuccessfulResponsesIntoSearchService() {
        RecordingSearchService searchService = new RecordingSearchService();
        TestDatabase database = new TestDatabase(searchService);

        Professor professor = new Professor("prof-1", "Ada", "Lovelace", 4.8f, 9);
        LectureModel lecture = new LectureModel(
                "lecture-1",
                "Algorithms",
                "240001",
                2026,
                SemesterSeason.WS,
                true,
                Collections.singletonList(professor),
                2,
                8,
                4.0
        );
        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 3, 10, 0);
        Comment reply = new Comment(
                "reply-1",
                "Indeed",
                ContentStatus.VISIBLE,
                "helper",
                "lecture-1",
                null,
                createdAt.plusMinutes(5),
                0,
                2,
                VoteType.UP,
                Collections.emptyList()
        );
        Comment comment = new Comment(
                "comment-1",
                "Helpful",
                ContentStatus.VISIBLE,
                "anon",
                "lecture-1",
                "/profiles/anon.png",
                createdAt,
                1,
                5,
                VoteType.UP,
                Collections.singletonList(reply)
        );
        APIService apiService = apiService(
                FakeCall.response(new ProfessorsResponse("ok", true, Collections.singletonList(professor))),
                FakeCall.response(new LecturesResponse("ok", true, Collections.singletonList(lecture))),
                FakeCall.response(new CommentsResponse("ok", true, Collections.singletonList(comment)))
        );

        database.updateDB(apiService);

        assertEquals(1, searchService.deleteProfessorsCalls);
        assertEquals(1, searchService.deleteLecturesCalls);
        assertEquals(0, searchService.deleteCommentsCalls);
        assertEquals(1, searchService.deleteInstructorsCalls);
        assertSame(professor, searchService.insertedProfessors.get(0));

        Lecture insertedLecture = searchService.insertedLectures.get(0);
        assertEquals("lecture-1", insertedLecture.id);
        assertEquals("Algorithms", insertedLecture.name);
        assertEquals(SemesterSeason.WS, insertedLecture.semesterSeason);
        assertEquals(8, insertedLecture.ratingCount);

        Instructor insertedInstructor = searchService.insertedInstructors.get(0);
        assertEquals("lecture-1", insertedInstructor.lectureID);
        assertEquals("Algorithms", insertedInstructor.lectureTitle);
        assertEquals("prof-1", insertedInstructor.professorID);

        assertTrue(searchService.insertedComments.isEmpty());
    }

    /**
     * Verifies that failed or incomplete refresh responses do not overwrite cached data.
     */
    @Test
    public void updateDBSkipsWritesWhenResponsesFailOrContainNoEntities() {
        RecordingSearchService searchService = new RecordingSearchService();
        TestDatabase database = new TestDatabase(searchService);
        APIService apiService = apiService(
                FakeCall.response(Response.<ProfessorsResponse>success(null)),
                FakeCall.failure(new IOException("offline")),
                FakeCall.response(new CommentsResponse("ok", true, null))
        );

        database.updateDB(apiService);

        assertEquals(0, searchService.deleteProfessorsCalls);
        assertEquals(0, searchService.deleteLecturesCalls);
        assertEquals(0, searchService.deleteCommentsCalls);
        assertEquals(0, searchService.deleteInstructorsCalls);
        assertTrue(searchService.insertedProfessors.isEmpty());
        assertTrue(searchService.insertedLectures.isEmpty());
        assertTrue(searchService.insertedComments.isEmpty());
    }

    /**
     * Verifies that HTTP errors and null entity lists are rejected during refresh.
     */
    @Test
    public void updateDBRejectsHttpErrorsAndNullEntityLists() {
        RecordingSearchService searchService = new RecordingSearchService();
        TestDatabase database = new TestDatabase(searchService);
        boolean[] callbackResult = {true};
        ResponseBody errorBody = ResponseBody.create(null, new byte[0]);
        APIService apiService = apiService(
                FakeCall.response(Response.error(503, errorBody)),
                FakeCall.response(new LecturesResponse("ok", true, null)),
                FakeCall.response(new CommentsResponse("ok", true, Collections.emptyList()))
        );

        database.updateDB(apiService, successful -> callbackResult[0] = successful);

        assertTrue(searchService.insertedProfessors.isEmpty());
        assertTrue(searchService.insertedLectures.isEmpty());
        assertEquals(false, callbackResult[0]);
    }

    private static APIService apiService(
            Call<ProfessorsResponse> professors,
            Call<LecturesResponse> lectures,
            Call<CommentsResponse> comments
    ) {
        return (APIService) Proxy.newProxyInstance(
                APIService.class.getClassLoader(),
                new Class<?>[]{APIService.class},
                (proxy, method, args) -> {
                    switch (method.getName()) {
                        case "getProfessors":
                            return professors;
                        case "getLectures":
                            return lectures;
                        case "getAllComments":
                            return comments;
                        default:
                            throw new UnsupportedOperationException(method.getName());
                    }
                }
        );
    }

    private static final class TestDatabase extends Database {
        private final SearchService searchService;
        private final ExecutorService executor = new DirectExecutorService();

        private TestDatabase(SearchService searchService) {
            this.searchService = searchService;
        }

        @Override
        public SearchService searchService() {
            return searchService;
        }

        @Override
        protected ExecutorService createUpdateExecutor() {
            return executor;
        }

        @Override
        protected RoomOpenDelegate createOpenDelegate() {
            return null;
        }

        @Override
        protected InvalidationTracker createInvalidationTracker() {
            return null;
        }

        @Override
        public void clearAllTables() {
        }

        @Override
        protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
            return Collections.emptyMap();
        }

        @Override
        public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
            return Collections.emptySet();
        }

        @Override
        public List<Migration> getAutoMigrations(
                Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs
        ) {
            return Collections.emptyList();
        }
    }

    private static final class DirectExecutorService extends AbstractExecutorService {
        private boolean shutdown;

        @Override
        public void shutdown() {
            shutdown = true;
        }

        @Override
        public List<Runnable> shutdownNow() {
            shutdown = true;
            return Collections.emptyList();
        }

        @Override
        public boolean isShutdown() {
            return shutdown;
        }

        @Override
        public boolean isTerminated() {
            return shutdown;
        }

        @Override
        public boolean awaitTermination(long timeout, TimeUnit unit) {
            return shutdown;
        }

        @Override
        public void execute(Runnable command) {
            command.run();
        }
    }

    private static final class FakeCall<T> implements Call<T> {
        private final Response<T> response;
        private final Throwable failure;

        private FakeCall(Response<T> response, Throwable failure) {
            this.response = response;
            this.failure = failure;
        }

        private static <T> FakeCall<T> response(T body) {
            return response(Response.success(body));
        }

        private static <T> FakeCall<T> response(Response<T> response) {
            return new FakeCall<>(response, null);
        }

        private static <T> FakeCall<T> failure(Throwable failure) {
            return new FakeCall<>(null, failure);
        }

        @Override
        public Response<T> execute() throws IOException {
            if (failure != null) {
                throw new IOException(failure);
            }
            return response;
        }

        @Override
        public void enqueue(Callback<T> callback) {
            if (failure != null) {
                callback.onFailure(this, failure);
                return;
            }
            callback.onResponse(this, response);
        }

        @Override
        public boolean isExecuted() {
            return false;
        }

        @Override
        public void cancel() {
        }

        @Override
        public boolean isCanceled() {
            return false;
        }

        @Override
        public Call<T> clone() {
            return new FakeCall<>(response, failure);
        }

        @Override
        public Request request() {
            return new Request.Builder().url("http://localhost/").build();
        }

        @Override
        public Timeout timeout() {
            return Timeout.NONE;
        }
    }

    private static final class RecordingSearchService implements SearchService {
        private final List<Professor> insertedProfessors = new ArrayList<>();
        private final List<Lecture> insertedLectures = new ArrayList<>();
        private final List<CommentModel> insertedComments = new ArrayList<>();
        private final List<Instructor> insertedInstructors = new ArrayList<>();
        private int deleteProfessorsCalls;
        private int deleteLecturesCalls;
        private int deleteCommentsCalls;
        private int deleteInstructorsCalls;

        @Override
        public List<Professor> searchProfessors(String query) {
            return Collections.emptyList();
        }

        @Override
        public List<Lecture> searchLectures(String query) {
            return Collections.emptyList();
        }

        @Override
        public void insertProfessor(Professor professor) {
            insertedProfessors.add(professor);
        }

        @Override
        public void insertProfessors(List<Professor> professors) {
            insertedProfessors.addAll(professors);
        }

        @Override
        public void insertLecture(Lecture lecture) {
            insertedLectures.add(lecture);
        }

        @Override
        public void insertLectures(List<Lecture> lectures) {
            insertedLectures.addAll(lectures);
        }

        @Override
        public void deleteProfessors() {
            deleteProfessorsCalls++;
        }

        @Override
        public void deleteLectures() {
            deleteLecturesCalls++;
        }

        @Override
        public List<Lecture> getLecturesByProfessor(String professorId) {
            return Collections.emptyList();
        }

        @Override
        public List<Lecture> getLecturesByProfessorAndLecture(String professorId, String lectureTitle) {
            return Collections.emptyList();
        }

        @Override
        public List<Professor> getProfessorsByLectureTitle(String lectureTitle) {
            return Collections.emptyList();
        }

        @Override
        public List<String> getLectureTitlesByProfessor(String professorId) {
            return Collections.emptyList();
        }

        @Override
        public List<Semester> getSemestersByProfessorAndLectureTitle(String professorId, String lectureTitle) {
            return Collections.emptyList();
        }

        @Override
        public List<Lecture> getLecture(
                String professorId,
                String lectureTitle,
                int semesterYear,
                SemesterSeason season
        ) {
            return Collections.emptyList();
        }

        @Override
        public void insertComment(CommentModel comment) {
            insertedComments.add(comment);
        }

        @Override
        public void insertComments(List<CommentModel> comments) {
            insertedComments.addAll(comments);
        }

        @Override
        public void deleteComments() {
            deleteCommentsCalls++;
        }

        @Override
        public void deleteCommentsForLecture(String lectureId) {
            deleteCommentsCalls++;
        }

        @Override
        public Professor getProfessorById(String id) {
            return null;
        }

        @Override
        public List<CommentModel> getComments(String lectureId) {
            return Collections.emptyList();
        }

        @Override
        public List<CommentModel> getReplies(String parentId) {
            return Collections.emptyList();
        }

        @Override
        public void insertInstructor(Instructor instructor) {
            insertedInstructors.add(instructor);
        }

        @Override
        public void insertInstructors(List<Instructor> instructors) {
            insertedInstructors.addAll(instructors);
        }

        @Override
        public void deleteInstructors() {
            deleteInstructorsCalls++;
        }

        @Override
        public List<Rating> getLectureRatings(String lectureID, Rater rater) {
            return Collections.emptyList();
        }

        @Override
        public void upsertRating(Rating rating) {

        }

        @Override
        public void deleteLectureRatings(String lectureId, Rater rater) {

        }

        @Override
        public List<Lecture> getLecturesByTitle(String lectureTitle) {
            return Collections.emptyList();
        }

        @Override
        public void updateLectureRating(String lectureId, double averageRating) {

        }

        @Override
        public void updateProfessorAverageRating(String professorId, double averageRating) {

        }
    }



}
