package com.example.myapplication_java.ServerCommunication;

import android.content.Context;
import android.util.Log;

import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.Responses.LecturesResponse;
import com.example.myapplication_java.ServerCommunication.Responses.ProfessorResponse;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
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
        entities = {Lecture.class, Professor.class},
        version = 4
)
public abstract class Database extends RoomDatabase {

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

    public Database() {}

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
        if (NO_UPDATE) return;
        Log.d(TAG, "updateDB started");

        SearchService service = searchService();
        // Room forbids database access on the main thread, so all writes go through this executor.
        ExecutorService executor = Executors.newSingleThreadExecutor();

        //the calls to the server for updating
        refreshTable(
                apiService.getProfessors(),
                ProfessorResponse::professors,
                service::deleteProfessors,
                service::insertProfessor,
                executor,
                "professors"
        );

        refreshTable(
                apiService.getLectures(),
                LecturesResponse::lectures,
                service::deleteLectures,
                service::insertLecture,
                executor,
                "lectures"
        );
    }

    /**
     * Replaces the content of one table with the data the server returns.
     *
     * <p>Professors and lectures are loaded in exactly the same way and only differ in their
     * response type and in the queries used, so both go through this method.</p>
     *
     * @param call       the request that loads the new data
     * @param extractor  reads the entity list out of the response body
     * @param clearTable deletes the current rows of the table
     * @param insert     inserts a single entity into the table
     * @param executor   the background thread the database writes run on
     * @param label      name of the table, used for logging
     * @param <R>        the response type of the request
     * @param <E>        the entity type stored in the table
     */
    private <R, E> void refreshTable(
            Call<R> call,
            Function<R, List<E>> extractor,
            Runnable clearTable,
            Consumer<E> insert,
            ExecutorService executor,
            String label
    ) {
        // retrofit2.Callback has to be written out here: RoomDatabase brings its own nested
        // Callback class along, which would shadow the imported one.
        call.enqueue(new retrofit2.Callback<R>() {
            @Override
            public void onResponse(Call<R> call, Response<R> response) {
                // A failed request has no body at all, so both checks are needed before reading it.
                if (!response.isSuccessful() || response.body() == null) {
                    Log.d(TAG, "Update of " + label + " failed: response not successful");
                    return;
                }

                List<E> entities = extractor.apply(response.body());
                if (entities == null) {
                    Log.e(TAG, "Update of " + label + " failed: response body is null");
                    return;
                }

                Log.d(TAG, "Received " + entities.size() + " " + label);

                // delete the table and add the new rows one by one
                executor.execute(() -> {
                    clearTable.run();
                    for (E entity : entities) {
                        insert.accept(entity);
                    }
                });
            }

            @Override
            public void onFailure(Call<R> call, Throwable throwable) {
                Log.d(TAG, "Update of " + label + " failed: " + throwable.getMessage());
            }
        });
    }
}
