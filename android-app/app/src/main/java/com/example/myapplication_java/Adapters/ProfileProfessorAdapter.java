package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.R;

import java.util.List;

public class ProfileProfessorAdapter extends RecyclerView.Adapter<ProfileProfessorAdapter.LectureViewHolder> {

    private List<Professor> professors;
    private OnProfessorClickListener listener;

    public ProfileProfessorAdapter(List<Professor> professors, OnProfessorClickListener listener) {
        this.professors = professors;
        this.listener = listener;
    }

    @NonNull
    @Override
    public LectureViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_prof_name_small, parent, false);
        return new LectureViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LectureViewHolder holder, int position) {
        Professor professor = professors.get(position);

        holder.textView.setText(professor.firstName+ " " + professor.lastName);
        holder.itemView.setOnClickListener(v -> listener.onProfessorClick(professor));
    }

    @Override
    public int getItemCount() {
        return professors.size();
    }

    public static class LectureViewHolder extends RecyclerView.ViewHolder {

        TextView textView;

        public LectureViewHolder(@NonNull View itemView) {
            super(itemView);
            textView = itemView.findViewById(R.id.lectureName);
        }
    }
    public interface OnProfessorClickListener {
        void onProfessorClick(Professor professor);
    }
}