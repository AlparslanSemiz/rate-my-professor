package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.myapplication_java.Adapters.ProfessorAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.databinding.FragmentLectureSelectionBinding;

import java.util.ArrayList;

public class LectureSelectionFragment extends Fragment {

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

        SearchService service = new SearchService(requireContext());

        // Just for testing. Can be removed later
        service.setMockDatabase();

        ArrayList<Professor> professors = service.searchProfessors("");
        binding.list.setAdapter(new ProfessorAdapter(professors));

        return binding.getRoot();
    }

    // I was at minute 6:37 and LectureListFragment.java in chat Datenbank für profe...

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}