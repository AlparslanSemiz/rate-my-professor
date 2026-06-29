package com.example.myapplication_java.Fragments;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;


import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.room.Room;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
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
    private ControlFlowInterface flowInterface;

    /**
     * The fragments get a new semesterSeason everytime it gets created.
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
        ).fallbackToDestructiveMigration(true).build();

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
                            binding.list.setAdapter(new ProfessorAdapter(professors, flowInterface::onProfessorSelected));
                        });
                        break;

                    case LECTURES:
                        if (lectures == null) {
                            lectures = new ArrayList<>(service.searchLectures(""));
                        }
                        requireActivity().runOnUiThread(() -> {
                            binding.list.setAdapter(new LectureAdapter(lectures, flowInterface::onLectureSelected));
                        });
                        break;
                }
            });
        }
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        if (context instanceof ControlFlowInterface) {
            flowInterface = (ControlFlowInterface) context;
        } else {
            throw new RuntimeException(context + "must implement ControlFlowInterface");
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}