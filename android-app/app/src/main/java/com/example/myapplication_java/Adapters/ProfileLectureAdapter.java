package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.ItemLectureNameSmallBinding;
import com.example.myapplication_java.databinding.ItemProfessorNameBinding;

import java.util.List;

/**
 * The adapter for lectures (upper list) in {@link com.example.myapplication_java.Fragments.ProfileFragment}
 */
public class ProfileLectureAdapter extends RecyclerView.Adapter<ProfileLectureAdapter.LectureViewHolder> {

    private List<String> lectures;
    private OnLectureClickListener listener;

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
        holder.itemView.setOnClickListener(v -> listener.onLectureClick(lecture));
    }

    @Override
    public int getItemCount() {
        return lectures.size();
    }

    public static class LectureViewHolder extends RecyclerView.ViewHolder {

        TextView textView;

        public LectureViewHolder(@NonNull ItemLectureNameSmallBinding binding) {
            super(binding.getRoot());
            textView = binding.lectureNameForProfile;
        }
    }
    public interface OnLectureClickListener {
        void onLectureClick(String lectureTitle);
    }
}