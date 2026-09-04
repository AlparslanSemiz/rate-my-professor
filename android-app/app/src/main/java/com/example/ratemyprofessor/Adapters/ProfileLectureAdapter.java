package com.example.ratemyprofessor.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.databinding.ItemLectureNameSmallBinding;

import java.util.List;

/**
 * The adapter for lectures (upper list) in {@link com.example.ratemyprofessor.Fragments.ProfileFragment}
 *
 * <p>Works on lecture titles rather than on {@link com.example.ratemyprofessor.DomainModel.Lecture}
 * objects: the same lecture is stored once per semester, and this list shows every title only
 * once. The concrete offering is picked afterwards in the semester list.</p>
 */
public class ProfileLectureAdapter extends RecyclerView.Adapter<ProfileLectureAdapter.LectureViewHolder> {

    private final List<String> lectures;
    private final OnLectureClickListener listener;
    private int currentChoice = 0;

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
         * @param lectureTitle the name of the clicked lecture
         */
        void onLectureClick(String lectureTitle);
    }
}
