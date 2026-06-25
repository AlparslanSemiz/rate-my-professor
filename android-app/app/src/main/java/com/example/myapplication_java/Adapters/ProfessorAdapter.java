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

public class ProfessorAdapter extends RecyclerView.Adapter<ProfessorAdapter.ProfessorViewHolder> {
    private List<Professor> professors;
    private OnProfessorClickListener listener;

    public ProfessorAdapter(List<Professor> professors, OnProfessorClickListener listener) {
        this.professors = professors;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ProfessorViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).
                inflate(R.layout.selection_item, parent, false);
        return new ProfessorViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ProfessorViewHolder holder, int position) {
        Professor professor = professors.get(position);
        holder.textView.setText(professor.firstName + " " + professor.lastName);
        holder.itemView.setOnClickListener(v -> listener.onProfessorClick(professor));
    }

    @Override
    public int getItemCount() {
        return professors.size();
    }

    public static class ProfessorViewHolder extends RecyclerView.ViewHolder {

        TextView textView;
        public ProfessorViewHolder(View itemview) {
            super(itemview);
            textView = itemview.findViewById(R.id.prof_placeholder);
        }
    }
    public interface OnProfessorClickListener {
        void onProfessorClick(Professor professor);
    }
}
