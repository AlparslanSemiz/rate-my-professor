package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.databinding.ItemProfNameSmallBinding;

import java.util.List;

/**
 * The adapter for professors (upper list) in {@link com.example.myapplication_java.Fragments.ProfileFragment}
 *
 * <p>Counterpart of {@link ProfileLectureAdapter}: the upper list shows professors when the
 * user started from a lecture, and lectures when they started from a professor.</p>
 */
public class ProfileProfessorAdapter extends RecyclerView.Adapter<ProfileProfessorAdapter.ProfessorViewHolder> {

    private final List<Professor> professors;
    private final OnProfessorClickListener listener;

    public ProfileProfessorAdapter(List<Professor> professors, OnProfessorClickListener listener) {
        this.professors = professors;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ProfessorViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemProfNameSmallBinding binding = ItemProfNameSmallBinding.inflate(LayoutInflater.from(parent.getContext()),
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

    /**
     * Holds the views of a single professor name.
     */
    public static class ProfessorViewHolder extends RecyclerView.ViewHolder {

        final TextView textView;

        public ProfessorViewHolder(@NonNull ItemProfNameSmallBinding binding) {
            super(binding.getRoot());
            textView = binding.profName;
        }
    }

    /**
     * Reports which professor the user clicked.
     */
    public interface OnProfessorClickListener {

        /**
         * @param professor the clicked professor
         */
        void onProfessorClick(Professor professor);
    }
}
