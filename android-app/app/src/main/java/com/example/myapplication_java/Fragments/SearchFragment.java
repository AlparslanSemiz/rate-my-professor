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
import com.example.myapplication_java.Adapters.SearchPagerAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.databinding.FragmentProfSelectionBinding;
import com.example.myapplication_java.databinding.FragmentSearchBinding;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

import java.util.ArrayList;

public class SearchFragment extends Fragment {

    //FragmentProfSelectionBinding binding;
    private RecyclerView recyclerView;

    private FragmentSearchBinding binding;
    @NonNull
    @Override
    public CreationExtras getDefaultViewModelCreationExtras() {
        return super.getDefaultViewModelCreationExtras();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        binding = FragmentSearchBinding.inflate(inflater, container, false);

        SearchPagerAdapter adapter = new SearchPagerAdapter(this);
        binding.searchViewPager.setAdapter(adapter);

        // The code below is android tab layout which sucks. But i leave it here in case i need it later
//        new TabLayoutMediator(
//                binding.searchTabLayout,
//                binding.searchViewPager,
//                (tab, position) -> {
//                    if (position == 0) {
//                        tab.setText("Professors");
//                    } else {
//                        tab.setText("Lectures");
//                    }
//                }
//        ).attach();

        return binding.getRoot();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
