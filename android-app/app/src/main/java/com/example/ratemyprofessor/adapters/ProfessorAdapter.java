package com.example.ratemyprofessor.adapters;

import android.annotation.SuppressLint;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.databinding.ItemProfessorNameBinding;

import java.util.List;

/**
 * The adapter for professors in {@link com.example.ratemyprofessor.fragments.SelectionFragment}
 *
 * <p>Clicks are reported through {@link OnProfessorClickListener} instead of being handled here,
 * so the adapter stays independent of what happens after a professor was picked.</p>
 */
public class ProfessorAdapter extends RecyclerView.Adapter<ProfessorAdapter.ProfessorViewHolder> {

    private final OnProfessorClickListener listener;

    private List<Professor> professors;

    /**
     * Creates a ProfessorAdapter with the supplied data and interaction listener.
     *
     * @param professors the professors to display
     * @param listener the listener notified when the user interacts with an item
     */
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

    /**
     * Holds the views of a single professor row.
     */
    public static class ProfessorViewHolder extends RecyclerView.ViewHolder {

        final TextView textView;

        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
        public ProfessorViewHolder(ItemProfessorNameBinding binding) {
            super(binding.getRoot());
            textView = binding.profName;
        }
    }

    /**
     * This method is used to update list of profs on runtime
     *
     * <p>Every search replaces the whole result list, so there is nothing to animate between
     * the old and the new content and the list is simply redrawn.</p>
     *
     * @param professors the professors to display from now on
     */
    @SuppressLint("NotifyDataSetChanged")
    public void setData(List<Professor> professors) {
        this.professors = professors;
        notifyDataSetChanged();
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
