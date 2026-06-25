package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.R;

import java.util.List;

public class ProfileSemesterAdapter extends RecyclerView.Adapter<ProfileSemesterAdapter.SemesterViewHolder> {

    private List<Semester> semesters;
    private OnSemesterClickListener listener;

    public ProfileSemesterAdapter(List<Semester> semesters, OnSemesterClickListener listener) {
        this.semesters = semesters;
        this.listener = listener;
    }

    @NonNull
    @Override
    public SemesterViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_lecture_name_small, parent, false);
        return new SemesterViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull SemesterViewHolder holder, int position) {
        Semester semester = semesters.get(position);

        holder.textView.setText(semester.semesterSeason.toString() + semester.semesterYear);
        holder.itemView.setOnClickListener(v -> listener.onLectureClick(semester));
    }

    @Override
    public int getItemCount() {
        return semesters.size();
    }

    public static class SemesterViewHolder extends RecyclerView.ViewHolder {

        TextView textView;

        public SemesterViewHolder(@NonNull View itemView) {
            super(itemView);
            textView = itemView.findViewById(R.id.lectureName);
        }
    }
    public interface OnSemesterClickListener {
        void onLectureClick(Semester semester);
    }
}