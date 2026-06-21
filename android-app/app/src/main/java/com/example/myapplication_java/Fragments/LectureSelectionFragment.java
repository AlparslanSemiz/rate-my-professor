package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.room.Room;

import com.example.myapplication_java.Adapters.ProfessorAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.databinding.FragmentLectureSelectionBinding;

import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LectureSelectionFragment extends Fragment {

    private SearchService service;
    private FragmentLectureSelectionBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentLectureSelectionBinding.inflate(inflater, container, false);

        binding.list.setLayoutManager(new LinearLayoutManager(getContext()));

        Database database = Room.databaseBuilder(
                getContext(),
                Database.class,
                Database.DB_NAME
        ).build();
        service = database.searchService();

        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            executor.execute(() -> {
                ArrayList<Professor> professors = new ArrayList<>(service.searchProfessors(""));
                getActivity().runOnUiThread(() -> {
                    binding.list.setAdapter(new ProfessorAdapter(professors));

                });
            });
        }

        return binding.getRoot();
    }

    // I was at minute 6:37 and LectureListFragment.java in chat Datenbank für profe...
    // >)) bro what??
    // watched a tutorial video and paused mid-way through xd
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
    public void setMockDatabase() {

        //dont forget to clear the database
        insert("001", "mathe", "mathematik");
        insert("002", "swt", "informatik");
        insert("003", "lineare algebra", "mathematik");
        insert("004", "hohere mathematik", "geologie");
        insert("005", "und so weiter", "lehramt");
    }

    public void insert(String id, String title, String desc) {
        Lecture lecture = new Lecture(id, title, "010101");
        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            executor.execute(() -> {
                service.insertLecture(lecture);
            });
        }
    }
}