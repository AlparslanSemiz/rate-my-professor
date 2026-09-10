package com.example.ratemyprofessor.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.domain.Professor;

import com.example.ratemyprofessor.databinding.ItemProfNameSmallBinding;

import java.util.List;

/**
 * The adapter for professors (upper list) in {@link com.example.ratemyprofessor.fragments.ProfileFragment}
 *
 * <p>Counterpart of {@link ProfileLectureAdapter}: the upper list shows professors when the
 * user started from a lecture, and lectures when they started from a professor.</p>
 */
public class ProfileProfessorAdapter extends RecyclerView.Adapter<ProfileProfessorAdapter.ProfessorViewHolder> {

    private final List<Professor> professors;
    private final OnProfessorClickListener listener;
    private int currentChoice = 0;

    /**
     * Creates a ProfileProfessorAdapter with the supplied data and interaction listener.
     *
     * @param professors the professors to display
     * @param listener the listener notified when the user interacts with an item
     */
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
        holder.itemView.setOnClickListener(v -> {
            int index = holder.getBindingAdapterPosition();
            listener.onProfessorClick(professor);
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
        return professors.size();
    }

    /**
     * Holds the views of a single professor name.
     */
    public static class ProfessorViewHolder extends RecyclerView.ViewHolder {

        final TextView textView;

        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
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
         * Handles the professor click event.
         *
         * @param professor the clicked professor
         */
        void onProfessorClick(Professor professor);
    }
}
