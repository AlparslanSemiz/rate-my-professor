package com.example.ratemyprofessor.servercommunication;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;

import com.example.ratemyprofessor.adapters.LocalDateTimeConverter;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.CommentModel;
import com.example.ratemyprofessor.domain.Instructor;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.LectureModel;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.servercommunication.responses.LecturesResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorsResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import java.util.function.Function;

import retrofit2.Call;
import retrofit2.Response;

/**
 * The local Room database. It mirrors the professors and lectures of the server, so the
 * search screen can work without a network round trip for every keystroke.
 *
 * <p>Use {@link #getInstance(Context)} to obtain the database. Room is expensive to build
 * and is meant to exist only once per process, so every screen shares the same instance.</p>
 */
@androidx.room.Database(
        entities = {Lecture.class, Professor.class, CommentModel.class, Instructor.class, Rating.class},
        version = 11,
        exportSchema = false

)
@TypeConverters(LocalDateTimeConverter.class)
public abstract class Database extends RoomDatabase {

    /**
     * Receives the result of a local database refresh.
     */
    public interface UpdateCallback {
        /**
         * Reports whether the database refresh completed successfully.
         *
         * @param successful whether the update completed successfully
         */
        void onComplete(boolean successful);
    }

    /**
     * File name of the database on the device.
     */
    public static final String DB_NAME = "database.db";

    private static final String TAG = "Database";

    /**
     * Switch to skip the server update while working on something else locally.
     */
    //Temporary I need to fix something.
    private static final boolean NO_UPDATE = false;

    /**
     * The single shared instance. Volatile so the double checked locking in
     * {@link #getInstance(Context)} stays safe across threads.
     */
    private static volatile Database instance;

    /**
     * Creates the database base instance used by the Room implementation.
     */
    public Database() {}

    /**
     * Returns the Room data access object for cached search and rating data.
     *
     * @return the generated data access object
     */
    public abstract SearchService searchService();


    /**
     * Returns the shared database and builds it on first use.
     *
     * <p>The application context is used on purpose: keeping an activity or fragment context
     * in a static field would keep that screen alive for the whole app lifetime.</p>
     *
     * @param context any context, for example an activity or a fragment's context
     * @return the shared database instance
     */
    public static Database getInstance(Context context) {
        if (instance == null) {
            synchronized (Database.class) {
                if (instance == null) {
                    instance = Room.databaseBuilder(
                            context.getApplicationContext(),
                            Database.class,
                            DB_NAME
                    ).fallbackToDestructiveMigration(true).build();
                }
            }
        }
        return instance;
    }

    /**
     * this updates the database from the server.
     *
     * <p>Professors and lectures are refreshed independently, so a failing request for one
     * of them does not block the other one.</p>
     *
     * @param apiService the service used to load the current data from the server
     */
    public void updateDB(APIService apiService) {
        updateDB(apiService, successful -> { });
    }

    /**
     * Refreshes professors and lectures asynchronously and reports whether both updates succeeded.
     *
     * @param apiService the service used to create backend requests
     * @param callback the callback notified when the update completes
     */
    public void updateDB(APIService apiService, UpdateCallback callback) {
        if (NO_UPDATE) {
            callback.onComplete(true);
            return;
        }
        Log.d(TAG, "updateDB started");

        SearchService service = searchService();
        ExecutorService executor = createUpdateExecutor();
        AtomicInteger remainingUpdates = new AtomicInteger(2);
        AtomicBoolean allSuccessful = new AtomicBoolean(true);
        Consumer<Boolean> updateFinished = successful -> {
            if (!successful) {
                allSuccessful.set(false);
            }
            if (remainingUpdates.decrementAndGet() == 0) {
                executor.shutdown();
                callback.onComplete(allSuccessful.get());
            }
        };

        refreshTable(
                apiService.getProfessors(),
                ProfessorsResponse::professors,
                service::replaceProfessors,
                executor,
                updateFinished,
                "professors"
        );

        refreshTable(
                apiService.getLectures(),
                LecturesResponse::lectures,
                this::replaceLectures,
                executor,
                updateFinished,
                "lectures"
        );
    }

    /**
     * Creates the single-thread executor used for database updates.
     *
     * @return a new single-thread executor
     */
    protected ExecutorService createUpdateExecutor() {
        return Executors.newSingleThreadExecutor();
    }

    /**
     * Replaces the content of one table with the data the server returns.
     *
     * <p>Professors and lectures are loaded in exactly the same way and only differ in their
     * response type and in the queries used, so both go through this method.</p>
     *
     * @param call       the request that loads the new data
     * @param extractor  reads the entity list out of the response body
     * @param replaceTable atomically replaces the locally stored entities
     * @param executor the background thread the database writes run on
     * @param updateFinished receives the result of this individual update
     * @param label name of the table, used for logging
     * @param <R>        the response type of the request
     * @param <E>        the entity type stored in the table
     */
    private <R, E> void refreshTable(
            Call<R> call,
            Function<R, List<E>> extractor,
            Consumer<List<E>> replaceTable,
            ExecutorService executor,
            Consumer<Boolean> updateFinished,
            String label
    ) {
        // retrofit2.Callback has to be written out here: RoomDatabase brings its own nested
        // Callback class along, which would shadow the imported one.
        call.enqueue(new retrofit2.Callback<>() {
            @Override
            public void onResponse(@NonNull Call<R> call, @NonNull Response<R> response) {
                // A failed request has no body at all, so both checks are needed before reading it.
                if (!response.isSuccessful() || response.body() == null) {
                    Log.d(TAG, "Update of " + label + " failed: response not successful");
                    updateFinished.accept(false);
                    return;
                }

                List<E> entities = extractor.apply(response.body());
                if (entities == null) {
                    Log.e(TAG, "Update of " + label + " failed: response body is null");
                    updateFinished.accept(false);
                    return;
                }

                Log.d(TAG, "Received " + entities.size() + " " + label);

                executor.execute(() -> {
                    try {
                        replaceTable.accept(entities);
                        updateFinished.accept(true);
                    } catch (RuntimeException exception) {
                        Log.e(TAG, "Update of " + label + " failed while writing", exception);
                        updateFinished.accept(false);
                    }
                });
            }

            @Override
            public void onFailure(@NonNull Call<R> call, @NonNull Throwable throwable) {
                Log.d(TAG, "Update of " + label + " failed: " + throwable.getMessage());
                updateFinished.accept(false);
            }
        });
    }

    private void replaceLectures(List<LectureModel> models) {
        SearchService service = searchService();
        List<Lecture> lectures = new ArrayList<>();
        List<Instructor> instructors = new ArrayList<>();

        for (LectureModel model : models) {
            lectures.add(new Lecture(
                    model.id(),
                    model.name(),
                    model.code(),
                    model.semesterYear(),
                    model.semesterSeason(),
                    model.active(),
                    model.commentCount(),
                    model.ratingCount(),
                    model.averageRating()
            ));
            for (Professor professor : model.professors()) {
                instructors.add(new Instructor(model.id(), model.name(), professor.id));
            }
        }

        service.replaceLectures(lectures, instructors);
    }
}
