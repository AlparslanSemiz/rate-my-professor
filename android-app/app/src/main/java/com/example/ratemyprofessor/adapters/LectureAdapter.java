package com.example.ratemyprofessor.adapters;

import android.annotation.SuppressLint;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.databinding.ItemLectureNameBinding;

import java.util.List;

/**
 * The adapter for lectures in {@link com.example.ratemyprofessor.fragments.SelectionFragment}
 *
 * <p>Clicks are reported through {@link OnLectureClickListener} instead of being handled here,
 * so the adapter stays independent of what happens after a lecture was picked.</p>
 */
public class LectureAdapter extends RecyclerView.Adapter<LectureAdapter.LectureViewHolder> {

    private final OnLectureClickListener listener;

    private List<Lecture> lectures;

    /**
     * Creates a LectureAdapter with the supplied data and interaction listener.
     *
     * @param lectures the lecture offerings to display
     * @param listener the listener notified when the user interacts with an item
     */
    public LectureAdapter(List<Lecture> lectures, OnLectureClickListener listener) {
        this.lectures = lectures;
        this.listener = listener;
    }

    @NonNull
    @Override
    public LectureViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemLectureNameBinding binding = ItemLectureNameBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new LectureViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull LectureViewHolder holder, int position) {
        Lecture lecture = lectures.get(position);
        holder.textView.setText(lecture.name);
        holder.itemView.setOnClickListener(v -> listener.onLectureClick(lecture.name));
    }

    @Override
    public int getItemCount() {
        return lectures.size();
    }

    /**
     * Holds the views of a single lecture row.
     */
    public static class LectureViewHolder extends RecyclerView.ViewHolder {

        final TextView textView;

        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
        public LectureViewHolder(@NonNull ItemLectureNameBinding binding) {
            super(binding.getRoot());
            textView = binding.semesterName;
        }
    }

    /**
     * Reports which lecture the user clicked.
     */
    public interface OnLectureClickListener {

        /**
         * Handles the lecture click event.
         *
         * @param lectureTitle the name of the clicked lecture
         */
        void onLectureClick(String lectureTitle);
    }

    /**
     * This method is used to update the list of lectures on runtime.
     *
     * <p>Every search replaces the whole result list, so there is nothing to animate between
     * the old and the new content and the list is simply redrawn.</p>
     *
     * @param lectures the lectures to display from now on
     */
    @SuppressLint("NotifyDataSetChanged")
    public void setData(List<Lecture> lectures) {
        this.lectures = lectures;
        notifyDataSetChanged();
    }
}
