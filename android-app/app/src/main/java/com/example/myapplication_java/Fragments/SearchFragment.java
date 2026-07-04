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
import android.text.Editable;
import android.text.TextWatcher;


import android.content.Context;
import android.view.inputmethod.InputMethodManager;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;


import androidx.lifecycle.ViewModelProvider;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.Adapters.SearchPagerAdapter;
import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.FragmentSearchBinding;
import com.example.myapplication_java.logic.SearchViewModel;

public class SearchFragment extends Fragment {

    private boolean searchModeOpen = false;
    private SearchViewModel searchViewModel;

    private FragmentSearchBinding binding;
    private ControlFlowInterface flowInterface;
    @NonNull
    @Override
    public CreationExtras getDefaultViewModelCreationExtras() {
        return super.getDefaultViewModelCreationExtras();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {

        binding = FragmentSearchBinding.inflate(inflater, container, false);

        SearchPagerAdapter adapter = new SearchPagerAdapter(this, () -> {
            if (searchModeOpen) {
                closeSearchMode();
            }
        });

        binding.searchViewPager.setAdapter(adapter);

        searchViewModel = new ViewModelProvider(this).get(SearchViewModel.class);

        setupSearchBarKeyboardMovement();
        setupSearchModeButtons();
        setupCloseSearchOnOutsideTouch();

        binding.profsButton.setOnClickListener(v -> {
            if (searchModeOpen) {
                closeSearchMode();
            }

            System.out.println("PROF BOTTOM GOT CLICKED");
            binding.searchViewPager.setCurrentItem(0, true);
        });

        binding.lecturesButton.setOnClickListener(v -> {
            if (searchModeOpen) {
                closeSearchMode();
            }

            System.out.println("LECTURE BOTTOM GOT CLICKED");
            binding.searchViewPager.setCurrentItem(1, true);
        });


        binding.clearSearchButton.setOnClickListener(v -> {
            binding.searchInput.setText("");
            searchViewModel.clearQuery();
        });

        binding.searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                searchViewModel.setQuery(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
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

    private void setupSearchBarKeyboardMovement() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.getRoot(), (v, insets) -> {
            Insets imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

            if (keyboardVisible && binding.searchBar.getVisibility() == View.VISIBLE) {
                binding.searchBar.setTranslationY(-imeInsets.bottom);
            } else {
                binding.searchBar.setTranslationY(0);
            }

            return insets;
        });
    }

    private void setupSearchModeButtons() {
        binding.searchButton.setOnClickListener(v -> {
            openSearchMode();
        });

        binding.clearSearchButton.setOnClickListener(v -> {
            closeSearchMode();
        });
    }

    private void openSearchMode() {
        searchModeOpen = true;

        binding.searchBar.setVisibility(View.VISIBLE);
        binding.searchButton.setVisibility(View.GONE);

        View bottomNav = requireActivity().findViewById(R.id.custom_bottom_nav);
        if (bottomNav != null) {
            bottomNav.setVisibility(View.GONE);
        }

        binding.searchInput.requestFocus();
        showKeyboard();
    }

    private void closeSearchMode() {
        if (!searchModeOpen) {
            return;
        }
        System.out.println("SEARCH_FRAGMENT: closeSearchMode");
        searchModeOpen = false;

        //binding.searchInput.setText("");
        //searchViewModel.clearQuery();

        binding.searchBar.setVisibility(View.GONE);
        binding.searchBar.setTranslationY(0);
        binding.searchButton.setVisibility(View.VISIBLE);

        hideKeyboard();

        View bottomNav = requireActivity().findViewById(R.id.custom_bottom_nav);
        if (bottomNav != null) {
            bottomNav.setVisibility(View.VISIBLE);
        }
    }

    private void showKeyboard() {
        binding.searchInput.post(() -> {
            InputMethodManager imm =
                    (InputMethodManager) requireContext()
                            .getSystemService(Context.INPUT_METHOD_SERVICE);

            if (imm != null) {
                imm.showSoftInput(binding.searchInput, InputMethodManager.SHOW_IMPLICIT);
            }
        });
    }

    private void hideKeyboard() {
        InputMethodManager imm =
                (InputMethodManager) requireContext()
                        .getSystemService(Context.INPUT_METHOD_SERVICE);

        if (imm != null) {
            imm.hideSoftInputFromWindow(binding.searchInput.getWindowToken(), 0);
        }
    }

    // If you click anywhere on the screen the search gets canceled.
    private void setupCloseSearchOnOutsideTouch() {

        System.out.println("SEARCH_FRAGMENT: setupCloseSearchOnOutsideTouch()");
        binding.searchRoot.setOnClickListener(v -> {
            if (searchModeOpen) {
                closeSearchMode();
            }
        });

        binding.searchViewPager.setOnClickListener(v -> {
            if (searchModeOpen) {
                closeSearchMode();
            }
        });

        binding.searchBar.setOnClickListener(v -> {
            // Should not do anything since clicking on the search bar should not close the search lol
        });

    }
}
