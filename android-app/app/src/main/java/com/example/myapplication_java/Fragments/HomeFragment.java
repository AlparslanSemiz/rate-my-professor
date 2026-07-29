package com.example.myapplication_java.Fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.FragmentHomeScreenBinding;

/**
 * The screen the app starts on. Currently its only action is opening the notifications.
 */
public class HomeFragment extends Fragment {

    private FragmentHomeScreenBinding binding;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentHomeScreenBinding.inflate(inflater, container, false);

        binding.notifications.setOnClickListener(v -> openNotifications());
        return binding.getRoot();
    }

    /**
     * Opens the notification screen.
     *
     * <p>Unlike the bottom navigation tabs this goes on the back stack, so its back button can
     * return here.</p>
     */
    private void openNotifications() {
        requireActivity().getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, new NotificationFragment())
                .addToBackStack(null)
                .commit();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
