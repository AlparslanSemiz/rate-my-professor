package com.example.myapplication_java.ServerCommunication;

import android.util.Log;

import androidx.room.RoomDatabase;

import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

@androidx.room.Database(
        entities = {Lecture.class, Professor.class},
        version = 1
)
public abstract class Database extends RoomDatabase {
    public static String DB_NAME = "database.db";

    public Database() {}
    public abstract SearchService searchService();

    //I probably shouldn't do it like this but I don't know where to put it.
    //Also we need to do error handling.
    public void updateDB(APIService apiService) {
        SearchService service = searchService();
        Call<List<Professor>> professorCall = apiService.getProfessors();
        Call<List<Lecture>> lectureCall = apiService.getLectures();
        List<Lecture> lectures = new ArrayList<>();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        professorCall.enqueue(new retrofit2.Callback<List<Professor>>() {
            @Override
            public void onResponse(Call<List<Professor>> call, Response<List<Professor>> response) {
                List<Professor> professors = response.body();

                if (professors == null) {
                    Log.e("Database", "Professor response body is null");
                    return;
                }
                executor.execute(() -> {
                    service.deleteProfessors();
                    for (Professor professor : professors) {
                        service.insertProfessor(professor);
                    }
                });
            }

            @Override
            public void onFailure(Call<List<Professor>> call, Throwable throwable) {
                Log.println(Log.DEBUG, "Database update failure", throwable.getMessage());
            }
        });
        lectureCall.enqueue(new retrofit2.Callback<List<Lecture>>() {
            @Override
            public void onResponse(Call<List<Lecture>> call, Response<List<Lecture>> response) {
                List<Lecture> lectures = response.body();

                if (lectures == null) {
                    Log.e("Database", "Lecture response body is null");
                    return;
                }

                executor.execute(() -> {
                    service.deleteLectures();
                    for (Lecture lecture : lectures) {
                        service.insertLecture(lecture);
                    }
                });
            }

            @Override
            public void onFailure(Call<List<Lecture>> call, Throwable throwable) {
                Log.println(Log.DEBUG, "Database update failure", throwable.getMessage());
            }
        });
    }
}
