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

import com.example.myapplication_java.Adapters.LectureAdapter;
import com.example.myapplication_java.Adapters.ProfessorAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.databinding.FragmentSelectionBinding;

import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SelectionFragment extends Fragment {

    private FragmentSelectionBinding binding;
    private SearchService service;
    private ArrayList<Lecture> lectures;
    private ArrayList<Professor> professors;
    private static final String ARG_SELECTION_TYPE = "selection_type";
    private SelectionType selectionType;

    /**
     * The fragments get a new type everytime it gets created.
     * This is how we differentiate between Lecture list and Prof list.
     * @param type
     * @return
     */
    public static SelectionFragment newInstance(SelectionType type) {
        SelectionFragment fragment = new SelectionFragment();

        Bundle args = new Bundle();

        args.putString(ARG_SELECTION_TYPE, type.name());
        fragment.setArguments(args);

        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentSelectionBinding.inflate(inflater, container, false);

        binding.list.setLayoutManager(new LinearLayoutManager(getContext()));

        Database database = Room.databaseBuilder(
                getContext(),
                Database.class,
                Database.DB_NAME
        ).build();

        service = database.searchService();

        String type = requireArguments().getString(ARG_SELECTION_TYPE);
        selectionType = SelectionType.valueOf(type);
        setList(selectionType);

        return binding.getRoot();
    }

    private void setList(SelectionType type) {

        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            executor.execute(() -> {
                switch (type) {
                    case PROFESSORS:
                        if (professors == null) {
                            professors = new ArrayList<>(service.searchProfessors(""));
                        }

                        requireActivity().runOnUiThread(() -> {
                            binding.list.setAdapter(new ProfessorAdapter(professors));
                        });
                        break;

                    case LECTURES:
                        if (lectures == null) {
                            lectures = new ArrayList<>(service.searchLectures(""));
                        }

                        requireActivity().runOnUiThread(() -> {
                            binding.list.setAdapter(new LectureAdapter(lectures));
                        });
                        break;
                }
            });
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
    public void setMockDatabase(boolean professor) {
        if (professor) {
            //dont forget to clear the database
            try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
                executor.execute(() -> {
                    service.deleteProfessors();
                });
            }
            insertProf("001", "Mustafa", "Mathematik");
            insertProf("002", "Erik", "Informatik");
            insertProf("003", "Stefan", "Mathematik");
            insertProf("004", "Linda", "Geologie");
            insertProf("005", "Paul", "Lehramt");
            insertProf("006", "Qaul", "Lehramt");
            insertProf("007", "Raul", "Lehramt");
            insertProf("008", "Saul", "Lehramt");
            insertProf("009", "Taul", "Lehramt");
            insertProf("010", "Uaul", "Lehramt");
            insertProf("011", "Vaul", "Lehramt");
            insertProf("012", "Waul", "Lehramt");
            insertProf("013", "Xaul", "Lehramt");
        } else {
            try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
                executor.execute(() -> {
                    service.deleteLectures();
                });
            }
            insertLecture("001", "mathe", "mathematik");
            insertLecture("002", "swt", "informatik");
            insertLecture("003", "lineare algebra", "mathematik");
            insertLecture("004", "hohere mathematik", "geologie");
            insertLecture("005", "und so weiter", "lehramt");
        }
    }

    public void insertProf(String id, String name, String dep) {
        Professor professor = new Professor(id, name, "lastname", dep, 5.0f);
        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            executor.execute(() -> {
                service.insertProfessor(professor);
            });
        }
    }
    public void insertLecture(String id, String title, String desc) {
        Lecture lecture = new Lecture(id, title, "010101");
        try (ExecutorService executor = Executors.newSingleThreadExecutor()) {
            executor.execute(() -> {
                service.insertLecture(lecture);
            });
        }
    }
}