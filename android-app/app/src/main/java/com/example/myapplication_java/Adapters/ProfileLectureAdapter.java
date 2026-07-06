package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.R;

import java.util.List;

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
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_lecture_semester_with_rating, parent, false);
        return new LectureViewHolder(view);
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

        public LectureViewHolder(@NonNull View itemView) {
            super(itemView);
            textView = itemView.findViewById(R.id.lectureName);
        }
    }
    public interface OnLectureClickListener {
        void onLectureClick(String lectureTitle);
    }
}