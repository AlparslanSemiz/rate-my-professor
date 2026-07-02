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
        version = 4
)
public abstract class Database extends RoomDatabase {
    public static String DB_NAME = "database.db";

    public Database() {}
    public abstract SearchService searchService();

    //I probably shouldn't do it like this but I don't know where to put it.
    //Also we need to do error handling.
    public void updateDB(APIService apiService) {
        Log.println(Log.DEBUG, "updateDB", "rein");
        SearchService service = searchService();
        Call<ProfessorResponse> professorCall = apiService.getProfessors();
        Call<LecturesResponse> lectureCall = apiService.getLectures();
        List<Lecture> lectures = new ArrayList<>();
        ExecutorService executor = Executors.newSingleThreadExecutor();

        professorCall.enqueue(new retrofit2.Callback<ProfessorResponse>() {
            @Override
            public void onResponse(Call<ProfessorResponse> call, Response<ProfessorResponse> response) {
                if (!response.isSuccessful()) {
                    Log.println(Log.DEBUG, "Database update failure", "response not successful");
                    return;
                }
                List<Professor> professors = response.body().professors;

                if (professors == null) {
                    Log.e("Database", "Professor response body is null");
                    return;
                }
                System.out.println("THIS IS THE SIZE OF PROFESSOR LIST: " + professors.size());
                executor.execute(() -> {
                    service.deleteProfessors();
                    for (Professor professor : professors) {
                        service.insertProfessor(professor);
                    }
                });
            }

            @Override
            public void onFailure(Call<ProfessorResponse> call, Throwable throwable) {
                Log.println(Log.DEBUG, "Database update failure", throwable.getMessage());
            }
        });

        lectureCall.enqueue(new retrofit2.Callback<LecturesResponse>() {
            @Override
            public void onResponse(Call<LecturesResponse> call, Response<LecturesResponse> response) {
                if (!response.isSuccessful()) {
                    Log.println(Log.DEBUG, "Database update failure", "response not successful");
                    return;
                }
                List<Lecture> lectures = response.body().lectures;

                if (lectures == null) {
                    Log.e("Database", "Lecture response body is null");
                    return;
                }

                System.out.println("THIS IS THE SIZE OF LECTURE LIST " + lectures.size());

                executor.execute(() -> {
                    service.deleteLectures();
                    for (Lecture lecture : lectures) {
                        service.insertLecture(lecture);
                    }
                });
            }

            @Override
            public void onFailure(Call<LecturesResponse> call, Throwable throwable) {
                Log.println(Log.DEBUG, "Database update failure", throwable.getMessage());
            }
        });
    }
}
