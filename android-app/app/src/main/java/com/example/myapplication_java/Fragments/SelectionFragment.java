package com.example.myapplication_java.Fragments;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.room.Room;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.Adapters.LectureAdapter;
import com.example.myapplication_java.Adapters.ProfessorAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.databinding.FragmentSelectionBinding;
import com.example.myapplication_java.logic.SearchViewModel;

import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Fragment for displaying either a list of professors or a list of lectures.
 *
 * <p>The concrete content of this fragment is determined by a {@link SelectionType}
 * argument. If the type is {@code PROFESSORS}, the fragment uses a
 * {@link ProfessorAdapter}; if the type is {@code LECTURES}, it uses a
 * {@link LectureAdapter}.</p>
 *
 * <p>The fragment observes the search query from the parent fragment's
 * {@link SearchViewModel} and updates the displayed list by querying the local
 * Room database through {@link SearchService}.</p>
 */
public class SelectionFragment extends Fragment {

    public interface UserInteractionListener {
        void onUserInteractedWithList();
    }

    private static final String ARG_SELECTION_TYPE = "selection_type";

    private FragmentSelectionBinding binding;
    private SearchService service;
    private SearchViewModel searchViewModel;
    private SelectionType selectionType;

    private ProfessorAdapter professorAdapter;
    private LectureAdapter lectureAdapter;

    private ControlFlowInterface flowInterface;
    private UserInteractionListener userInteractionListener;

    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    public static SelectionFragment newInstance(SelectionType type) {
        SelectionFragment fragment = new SelectionFragment();

        Bundle args = new Bundle();
        args.putString(ARG_SELECTION_TYPE, type.name());
        fragment.setArguments(args);

        return fragment;
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);

        if (context instanceof ControlFlowInterface) {
            flowInterface = (ControlFlowInterface) context;
        } else {
            throw new RuntimeException(context + " must implement ControlFlowInterface");
        }
    }

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentSelectionBinding.inflate(inflater, container, false);

        binding.list.setLayoutManager(new LinearLayoutManager(requireContext()));

        setupUserInteractionListener();

        Database database = Room.databaseBuilder(
                requireContext(),
                Database.class,
                Database.DB_NAME
        ).fallbackToDestructiveMigration(true).build();

        service = database.searchService();

        String type = requireArguments().getString(ARG_SELECTION_TYPE);
        selectionType = SelectionType.valueOf(type);

        searchViewModel = new ViewModelProvider(requireParentFragment()).get(SearchViewModel.class);

        setupAdapter();
        observeSearchQuery();

        return binding.getRoot();
    }

    private void setupUserInteractionListener() {
        binding.list.addOnItemTouchListener(new RecyclerView.SimpleOnItemTouchListener() {
            @Override
            public boolean onInterceptTouchEvent(
                    @NonNull RecyclerView rv,
                    @NonNull MotionEvent e
            ) {
                if (userInteractionListener != null) {
                    userInteractionListener.onUserInteractedWithList();
                }

                return false;
            }
        });
    }

    private void setupAdapter() {
        switch (selectionType) {
            case PROFESSORS:
                professorAdapter = new ProfessorAdapter(
                        new ArrayList<>(),
                        flowInterface::onProfessorSelected
                );
                binding.list.setAdapter(professorAdapter);
                break;

            case LECTURES:
                lectureAdapter = new LectureAdapter(
                        new ArrayList<>(),
                        flowInterface::onLectureSelected
                );
                binding.list.setAdapter(lectureAdapter);
                break;
        }
    }

    private void observeSearchQuery() {
        searchViewModel.getQuery().observe(getViewLifecycleOwner(), this::search);
    }

    private void search(String query) {
        executorService.execute(() -> {
            switch (selectionType) {
                case PROFESSORS:
                    ArrayList<Professor> professorResults =
                            new ArrayList<>(service.searchProfessors(query));

                    requireActivity().runOnUiThread(() -> {
                        if (binding != null && professorAdapter != null) {
                            professorAdapter.setData(professorResults);
                        }
                    });
                    break;

                case LECTURES:
                    ArrayList<Lecture> lectureResults =
                            new ArrayList<>(service.searchLectures(query));

                    requireActivity().runOnUiThread(() -> {
                        if (binding != null && lectureAdapter != null) {
                            lectureAdapter.setData(lectureResults);
                        }
                    });
                    break;
            }
        });
    }

    public void setUserInteractionListener(UserInteractionListener listener) {
        this.userInteractionListener = listener;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}