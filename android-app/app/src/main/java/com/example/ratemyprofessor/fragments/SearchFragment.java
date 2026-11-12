package com.example.ratemyprofessor.fragments;

import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.viewpager2.widget.ViewPager2;

import com.example.ratemyprofessor.adapters.ControlFlowInterface;
import com.example.ratemyprofessor.adapters.SearchPagerAdapter;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.databinding.FragmentSearchBinding;
import com.example.ratemyprofessor.logic.SearchViewModel;

/**
 * Fragment for the search screen of the application.
 *
 * <p>This fragment contains the professor and lecture tabs inside a {@link ViewPager2}.
 * It also controls the search mode, including opening and closing the search bar,
 * moving the search bar above the soft keyboard, hiding the bottom navigation bar
 * while searching, and forwarding the current search query to the shared
 * {@link SearchViewModel}.</p>
 *
 * <p>The actual result lists are displayed by child {@link SelectionFragment}
 * instances through the {@link SearchPagerAdapter}.</p>
 */
public class SearchFragment extends Fragment {

    private static final String TAG = "SearchFragment";

    /**
     * Page index of the professor tab, matching the order of
     * {@link com.example.ratemyprofessor.domain.SelectionType}.
     */
    private static final int PROFESSOR_TAB = 0;

    /**
     * Page index of the lecture tab.
     */
    private static final int LECTURE_TAB = 1;

    private boolean searchModeOpen = false;
    private SearchViewModel searchViewModel;

    private FragmentSearchBinding binding;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {

        binding = FragmentSearchBinding.inflate(inflater, container, false);

        binding.searchButton.setEnableDynamicBackground(true);
        binding.searchButton.setEnableAdaptiveTint(true);
        binding.searchButton.setCollectFrameStats(false);

        binding.profsButton.setEnableDynamicBackground(true);
        binding.profsButton.setEnableAdaptiveTint(true);
        binding.profsButton.setCollectFrameStats(false);

        binding.lecturesButton.setEnableDynamicBackground(true);
        binding.lecturesButton.setEnableAdaptiveTint(true);
        binding.lecturesButton.setCollectFrameStats(false);

        // Touching a result list means the user is done typing, so the search bar closes.
        SearchPagerAdapter adapter = new SearchPagerAdapter(this, this::closeSearchMode);

        binding.searchViewPager.setAdapter(adapter);

        // Owned by this fragment, observed by both tabs, which is how they stay in sync.
        searchViewModel = new ViewModelProvider(this).get(SearchViewModel.class);

        setupSearchBarKeyboardMovement();
        setupSearchModeButtons();
        setupCloseSearchOnOutsideTouch();
        setupTabButtons();
        setupSearchInput();

        return binding.getRoot();
    }

    /**
     * Connects the two tab buttons to their page and keeps them in sync when the user swipes.
     */
    private void setupTabButtons() {
        binding.profsButton.setOnClickListener(v -> {
            closeSearchMode();

            binding.searchViewPager.setCurrentItem(PROFESSOR_TAB, true);
        });

        binding.lecturesButton.setOnClickListener(v -> {
            closeSearchMode();

            binding.searchViewPager.setCurrentItem(LECTURE_TAB, true);
        });

        binding.searchViewPager.registerOnPageChangeCallback(
                new ViewPager2.OnPageChangeCallback() {
                    @Override
                    public void onPageSelected(int position) {
                        super.onPageSelected(position);

                        if (position == PROFESSOR_TAB) {
                            selectProfessorTab();
                        } else {
                            selectLectureTab();
                        }
                    }
                }
        );
    }

    /**
     * Publishes every keystroke to the {@link SearchViewModel}, which is what makes the result
     * lists filter while typing.
     */
    private void setupSearchInput() {
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
    }

    private void selectProfessorTab() {
        binding.profsButton.setSelected(true);
        binding.lecturesButton.setSelected(false);

        binding.profsButton.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(150)
                .start();

        binding.lecturesButton.animate()
                .alpha(0.65f)
                .scaleX(0.97f)
                .scaleY(0.97f)
                .setDuration(150)
                .start();
    }

    private void selectLectureTab() {
        binding.profsButton.setSelected(false);
        binding.lecturesButton.setSelected(true);

        binding.profsButton.animate()
                .alpha(0.65f)
                .scaleX(0.97f)
                .scaleY(0.97f)
                .setDuration(150)
                .start();

        binding.lecturesButton.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(150)
                .start();
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        if (context instanceof ControlFlowInterface) {
            ControlFlowInterface flowInterface = (ControlFlowInterface) context;
        } else {
            throw new RuntimeException(context + "must implement ControlFlowInterface");
        }
    }
    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    /**
     * Keeps the search bar directly above the soft keyboard by shifting it up by the height
     * the keyboard covers.
     */
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

    /**
     * Connects the button that opens the search bar and the one that closes it again.
     */
    private void setupSearchModeButtons() {
        binding.searchButton.setOnClickListener(v -> openSearchMode());

        // Clearing the text and closing the bar both belong to this one button. They used to
        // be registered as two separate listeners, so the later one silently replaced the
        // earlier one and only half of the work happened.
        binding.clearSearchButton.setOnClickListener(v -> {
            binding.searchInput.setText("");
            searchViewModel.clearQuery();
            closeSearchMode();
        });
    }

    /**
     * Shows the search bar and gives it the keyboard. The bottom navigation is hidden while
     * searching, so the bar can sit right above the keyboard.
     */
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

    /**
     * Hides the search bar and brings the bottom navigation back.
     *
     * <p>Callers do not have to check whether the search bar is open, this returns right away
     * when there is nothing to close.</p>
     */
    private void closeSearchMode() {
        if (!searchModeOpen) {
            return;
        }
        searchModeOpen = false;



        binding.searchBar.setVisibility(View.GONE);
        binding.searchBar.setTranslationY(0);
        binding.searchButton.setVisibility(View.VISIBLE);

        hideKeyboard();

        View bottomNav = requireActivity().findViewById(R.id.custom_bottom_nav);
        if (bottomNav != null) {
            bottomNav.setVisibility(View.VISIBLE);
        }
    }

    /**
     * Opens the keyboard for the search input.
     *
     * <p>Posted rather than called directly, because the input only accepts focus once it is
     * actually laid out.</p>
     */
    private void showKeyboard() {
        binding.searchInput.post(() -> {
            InputMethodManager imm = inputMethodManager();

            if (imm != null) {
                imm.showSoftInput(binding.searchInput, InputMethodManager.SHOW_IMPLICIT);
            }
        });
    }

    /**
     * Closes the keyboard again.
     */
    private void hideKeyboard() {
        InputMethodManager imm = inputMethodManager();

        if (imm != null) {
            imm.hideSoftInputFromWindow(binding.searchInput.getWindowToken(), 0);
        }
    }

    /**
     * @return the system service controlling the soft keyboard, or null when it is unavailable
     */
    private InputMethodManager inputMethodManager() {
        return (InputMethodManager) requireContext()
                .getSystemService(Context.INPUT_METHOD_SERVICE);
    }

    // If you click anywhere on the screen the search gets canceled.
    private void setupCloseSearchOnOutsideTouch() {

        binding.searchRoot.setOnClickListener(v -> closeSearchMode());

        binding.searchViewPager.setOnClickListener(v -> closeSearchMode());

        binding.searchBar.setOnClickListener(v -> {
            // Should not do anything since clicking on the search bar should not close the search lol
        });

    }
}
