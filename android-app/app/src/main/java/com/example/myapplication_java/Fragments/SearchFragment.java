package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.viewmodel.CreationExtras;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.Adapters.ProfessorAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.databinding.FragmentProfSelectionBinding;

import java.util.ArrayList;

public class SearchFragment extends Fragment {

    FragmentProfSelectionBinding binding;
    private RecyclerView recyclerView;

    @NonNull
    @Override
    public CreationExtras getDefaultViewModelCreationExtras() {
        return super.getDefaultViewModelCreationExtras();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentProfSelectionBinding.inflate(inflater, container, false);
        recyclerView = binding.list;
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        SearchService service = new SearchService(getContext());
        service.setMockDatabase();
        ArrayList<Professor> professors = service.searchProfessors("");
        recyclerView.setAdapter(new ProfessorAdapter(professors));
        return binding.getRoot();
    }
}
