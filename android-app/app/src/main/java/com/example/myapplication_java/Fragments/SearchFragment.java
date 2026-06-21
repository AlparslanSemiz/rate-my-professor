package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.viewmodel.CreationExtras;
import androidx.viewpager2.widget.ViewPager2;

import com.example.myapplication_java.Adapters.SearchPagerAdapter;
import com.example.myapplication_java.databinding.FragmentSearchBinding;

public class SearchFragment extends Fragment {

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

        binding.profsButton.setOnClickListener(v -> {
            System.out.println("PROF BOTTOM GOT CLICKED");
            binding.searchViewPager.setCurrentItem(0, true);
        });

        binding.lecturesButton.setOnClickListener(v -> {
            System.out.println("LECTURE BOTTOM GOT CLICKED");
            binding.searchViewPager.setCurrentItem(1, true);
        });

        binding.searchViewPager.registerOnPageChangeCallback(
                new ViewPager2.OnPageChangeCallback() {
                    @Override
                    public void onPageSelected(int position) {
                        super.onPageSelected(position);

                        if (position == 0) {
                            System.out.println("SWIPE TO PROF TAB");
                            selectProfessorTab();
                        } else {
                            System.out.println("SWIPE TO LECTURE TAB");
                            selectLectureTab();
                        }
                    }
                }
        );

        return binding.getRoot();
    }

    private void selectProfessorTab() {
        binding.profsButton.setSelected(true);
        binding.lecturesButton.setSelected(false);
    }

    private void selectLectureTab() {
        binding.profsButton.setSelected(false);
        binding.lecturesButton.setSelected(true);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
