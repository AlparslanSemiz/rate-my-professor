package com.example.ratemyprofessor.adapters;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.example.ratemyprofessor.fragments.SelectionFragment;
import com.example.ratemyprofessor.domain.SelectionType;

/**
 * Bridge between the UI and the Fragment. Is used to manage and create
 * the fragments according to the interaction with the ViewPager2
 *
 * <p>There is one page per {@link SelectionType}, in the order the constants are declared.
 * Adding a constant therefore adds a tab without any change in here.</p>
 */
public class SearchPagerAdapter extends FragmentStateAdapter {

    /**
     * The pages of the ViewPager2, one per selection type.
     * Position 0 = Professors
     * Position 1 = Lectures
     */
    private static final SelectionType[] PAGES = SelectionType.values();

    private final SelectionFragment.UserInteractionListener userInteractionListener;

    /**
     * Creates a SearchPagerAdapter with the supplied data and interaction listener.
     *
     * @param fragment the fragment hosting the search pages
     * @param userInteractionListener the listener notified when the user interacts with a search result
     */
    public SearchPagerAdapter(@NonNull Fragment fragment, SelectionFragment.UserInteractionListener userInteractionListener) {
        super(fragment);
        this.userInteractionListener = userInteractionListener;
    }

    /**
     * Manages the creation of fragments and its position.
     *
     * @param position the page index the ViewPager2 asks for
     * @return the selection fragment showing the content of that page
     */
    @NonNull
    @Override
    public Fragment createFragment(int position) {
        SelectionFragment fragment = SelectionFragment.newInstance(pageTypeAt(position));
        fragment.setUserInteractionListener(userInteractionListener);
        return fragment;
    }

    /**
     * Is used to get the total number of items set by this adapter
     *
     * @return the number of pages, which is the number of selection types
     */
    @Override
    public int getItemCount() {
        return PAGES.length;
    }

    /**
     * Maps a page index to the content that page shows.
     *
     * <p>The ViewPager2 only ever asks for valid positions. Anything else falls back to the
     * last page instead of throwing, so an unexpected index cannot crash the search screen.</p>
     *
     * @param position the page index
     * @return what the page at that index lists
     */
    private static SelectionType pageTypeAt(int position) {
        if (position < 0 || position >= PAGES.length) {
            return PAGES[PAGES.length - 1];
        }
        return PAGES[position];
    }
}
