package com.example.myapplication_java.Adapters;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.example.myapplication_java.Fragments.SelectionFragment;
import com.example.myapplication_java.DomainModel.SelectionType;

/**
 * Bridge between the UI and the Fragment. Is used to manage and create
 * the fragments according to the interaction with the ViewPager2
 */
public class SearchPagerAdapter extends FragmentStateAdapter {
    private final SelectionFragment.UserInteractionListener userInteractionListener;
    public SearchPagerAdapter(@NonNull Fragment fragment, SelectionFragment.UserInteractionListener userInteractionListener) {
        super(fragment);
        this.userInteractionListener = userInteractionListener;
    }

    /**
     * Manages the creation of fragments and its position.
     * Position 0 = Professors
     * Position 1 = Lectures
     * @param position
     * @return
     */
    @NonNull
    @Override
    public Fragment createFragment(int position) {

        SelectionFragment fragment;

        if (position == 0) {
            fragment = SelectionFragment.newInstance(SelectionType.PROFESSORS);
        } else {
            fragment = SelectionFragment.newInstance(SelectionType.LECTURES);
        }

        fragment.setUserInteractionListener(userInteractionListener);
        return fragment;
    }

    /**
     * Is used to get the total number of items set by this adapter
     * @return
     */
    @Override
    public int getItemCount() {
        return 2;
    }
}
