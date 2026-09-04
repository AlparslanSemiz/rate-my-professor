package com.example.ratemyprofessor.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.DomainModel.Semester;
import com.example.ratemyprofessor.databinding.ItemLectureSemesterWithRatingBinding;

import java.util.List;
import java.util.Locale;

/**
 * The adapter for semesters (lower list) in {@link com.example.ratemyprofessor.Fragments.ProfileFragment}
 *
 * <p>This is the last step of the selection: professor and lecture are already known, so
 * picking a semester identifies exactly one lecture offering and opens its rating screen.</p>
 */
public class ProfileSemesterAdapter extends RecyclerView.Adapter<ProfileSemesterAdapter.SemesterViewHolder> {

    private static final String RATING_FORMAT = "%.1f";
    private final List<Semester> semesters;
    private final OnSemesterClickListener listener;

    public ProfileSemesterAdapter(List<Semester> semesters, OnSemesterClickListener listener) {
        this.semesters = semesters;
        this.listener = listener;
    }

    @NonNull
    @Override
    public SemesterViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemLectureSemesterWithRatingBinding binding = ItemLectureSemesterWithRatingBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        // R.layout.item_lecture_semester_with_rating ?
        return new SemesterViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull SemesterViewHolder holder, int position) {
        Semester semester = semesters.get(position);

        holder.textView.setText(semester.semesterSeason().toString() + " " + semester.semesterYear());
        holder.itemView.setOnClickListener(v -> listener.onSemesterClick(semester));
    }

    @Override
    public int getItemCount() {
        return semesters.size();
    }

    /**
     * Holds the views of a single semester row.
     */
    public static class SemesterViewHolder extends RecyclerView.ViewHolder {

        final TextView textView;
        final TextView averageRating;

        public SemesterViewHolder(@NonNull ItemLectureSemesterWithRatingBinding binding) {
            super(binding.getRoot());
            textView = binding.lectureNameForProfile;
            averageRating = binding.averageRatingBackground;
        }
    }

}
