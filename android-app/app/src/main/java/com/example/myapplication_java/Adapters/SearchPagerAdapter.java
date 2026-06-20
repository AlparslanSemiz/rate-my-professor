package com.example.myapplication_java.Adapters;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;

import com.example.myapplication_java.Fragments.SelectionFragment;
import com.example.myapplication_java.Fragments.SelectionType;

/**
 * Bridge between the UI and the Fragment. Is used to manage and create
 * the fragments according to the interaction with the ViewPager2
 */
public class SearchPagerAdapter extends FragmentStateAdapter {
    public SearchPagerAdapter(@NonNull Fragment fragment) {
        super(fragment);
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
        if (position == 0) {
            return SelectionFragment.newInstance(SelectionType.PROFESSORS);
        } else {
            return SelectionFragment.newInstance(SelectionType.LECTURES);
        }
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
