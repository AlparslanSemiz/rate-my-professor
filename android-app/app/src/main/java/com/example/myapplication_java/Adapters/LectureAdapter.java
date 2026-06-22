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

public class LectureAdapter extends RecyclerView.Adapter<LectureAdapter.LectureViewHolder> {

    private List<Lecture> lectures;

    public LectureAdapter(List<Lecture> lectures) {
        this.lectures = lectures;
    }

    @NonNull
    @Override
    public LectureViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_lecture_name, parent, false);
        return new LectureViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LectureViewHolder holder, int position) {
        Lecture lecture = lectures.get(position);

        holder.textView.setText(lecture.name); // This could be done better with a getter
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
}