package com.example.ratemyprofessor.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.databinding.ItemLectureNameSmallBinding;

import java.util.List;

/**
 * The adapter for lectures (upper list) in {@link com.example.ratemyprofessor.fragments.ProfileFragment}
 *
 * <p>Works on lecture titles rather than on {@link com.example.ratemyprofessor.domain.Lecture}
 * objects: the same lecture is stored once per semester, and this list shows every title only
 * once. The concrete offering is picked afterward in the semester list.</p>
 */
public class ProfileLectureAdapter extends RecyclerView.Adapter<ProfileLectureAdapter.LectureViewHolder> {

    private final List<String> lectures;
    private final OnLectureClickListener listener;
    private int currentChoice = 0;

    /**
     * Creates a ProfileLectureAdapter with the supplied data and interaction listener.
     *
     * @param lectures the lecture offerings to display
     * @param listener the listener notified when the user interacts with an item
     */
    public ProfileLectureAdapter(List<String> lectures, OnLectureClickListener listener) {
        this.lectures = lectures;
        this.listener = listener;
    }

    @NonNull
    @Override
    public LectureViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemLectureNameSmallBinding binding = ItemLectureNameSmallBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new LectureViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull LectureViewHolder holder, int position) {
        String lecture = lectures.get(position);

        holder.textView.setText(lecture);
        holder.itemView.setOnClickListener(v -> {
            int index = holder.getBindingAdapterPosition();
            listener.onLectureClick(lecture);
            if (position == currentChoice) {
                return;
            }
            int oldPosition = currentChoice;
            currentChoice = index;
            notifyItemChanged(oldPosition);
            notifyItemChanged(index);
        });
        holder.itemView.setSelected(position == currentChoice);
    }

    @Override
    public int getItemCount() {
        return lectures.size();
    }

    /**
     * Holds the views of a single lecture title.
     */
    public static class LectureViewHolder extends RecyclerView.ViewHolder {

        final TextView textView;

        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
        public LectureViewHolder(@NonNull ItemLectureNameSmallBinding binding) {
            super(binding.getRoot());
            textView = binding.lectureNameForProfile;
        }
    }

    /**
     * Reports which lecture title the user clicked.
     */
    public interface OnLectureClickListener {

        /**
         * Handles the lecture click event.
         *
         * @param lectureTitle the name of the clicked lecture
         */
        void onLectureClick(String lectureTitle);
    }
}
