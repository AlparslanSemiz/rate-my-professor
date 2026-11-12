package com.example.ratemyprofessor.fragments;

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

import com.example.ratemyprofessor.adapters.ControlFlowInterface;
import com.example.ratemyprofessor.adapters.LectureAdapter;
import com.example.ratemyprofessor.adapters.ProfessorAdapter;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.SelectionType;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.databinding.FragmentSelectionBinding;
import com.example.ratemyprofessor.logic.SearchViewModel;

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

    /**
     * Reports that the user touched the result list, which the search screen uses to close
     * the search bar again.
     */
    public interface UserInteractionListener {
        /**
         * Notifies the host that the user interacted with the search results.
         */
        void onUserInteractedWithList();
    }

    /**
     * Key of the fragment argument holding the {@link SelectionType}.
     */
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

    /**
     * Creates a fragment listing the given kind of content.
     *
     * <p>The type travels as a fragment argument rather than as a constructor parameter, so
     * Android can restore it after the fragment was recreated.</p>
     *
     * @param type what the fragment should list
     * @return the configured fragment
     */
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

        service = Database.getInstance(requireContext()).searchService();

        String type = requireArguments().getString(ARG_SELECTION_TYPE);
        selectionType = SelectionType.valueOf(type);

        searchViewModel = new ViewModelProvider(requireParentFragment()).get(SearchViewModel.class);

        setupAdapter();
        observeSearchQuery();

        return binding.getRoot();
    }

    /**
     * Watches the list for touches and forwards them to the search screen.
     *
     * <p>An item touch listener is used rather than item clicks, because scrolling should
     * close the search bar as well.</p>
     */
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

    ///Sets the adapter according to the selection type.
    /// The list starts out empty and is filled by the first search query.
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

            default:
                throw new IllegalStateException("No adapter defined for " + selectionType);
        }
    }

    /**
     * Re-runs the search whenever the parent screen reports a new query.
     */
    private void observeSearchQuery() {
        searchViewModel.getQuery().observe(getViewLifecycleOwner(), this::search);
    }

    /**
     * Looks the query up in the local database and hands the result to the adapter.
     *
     * <p>Room queries block, so they run on the executor. The result is published back on the
     * UI thread, where the null checks catch the case that the view was destroyed while the
     * query was still running.</p>
     *
     * @param query the text the user typed; an empty string lists everything
     */
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

    /**
     * Registers who should be told when the user touches the list.
     *
     * @param listener the listener, set by {@link com.example.ratemyprofessor.adapters.SearchPagerAdapter}
     */
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