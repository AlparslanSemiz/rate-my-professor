package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.ItemLectureNameBinding;
import com.example.myapplication_java.databinding.ItemProfessorNameBinding;

import java.util.List;

/**
 * The adapter for professors in {@link com.example.myapplication_java.Fragments.SelectionFragment}
 */
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
        ItemProfessorNameBinding binding = ItemProfessorNameBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new ProfessorViewHolder(binding);
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
        public ProfessorViewHolder(ItemProfessorNameBinding binding) {
            super(binding.getRoot());
            textView = binding.profName;
        }
    }

    /**
     * This method is used to update list of profs on runtime
     * @param professors
     */
    public void setData(List<Professor> professors) {
        this.professors = professors;
        notifyDataSetChanged();
    }

    public interface OnProfessorClickListener {
        void onProfessorClick(Professor professor);
    }
}
