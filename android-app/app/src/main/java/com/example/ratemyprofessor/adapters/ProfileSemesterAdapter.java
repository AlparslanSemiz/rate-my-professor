package com.example.ratemyprofessor.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.databinding.ItemLectureSemesterWithRatingBinding;
import com.example.ratemyprofessor.logic.RatingColorCalculator;

import java.util.List;
import java.util.Locale;

/**
 * The adapter for semesters (lower list) in {@link com.example.ratemyprofessor.fragments.ProfileFragment}
 *
 * <p>This is the last step of the selection: professor and lecture are already known, so
 * picking a semester identifies exactly one lecture offering and opens its rating screen.</p>
 */
public class ProfileSemesterAdapter extends RecyclerView.Adapter<ProfileSemesterAdapter.SemesterViewHolder> {

    private static final String RATING_FORMAT = "%.1f";
    private final List<Semester> semesters;

    private final List<Lecture> lectures;
    private final OnSemesterClickListener listener;

    private final Context context;

    /**
     * Creates a ProfileSemesterAdapter with the supplied data and interaction listener.
     *
     * @param context the Android context used to access resources and services
     * @param semesters the semesters available for selection
     * @param lectures the lecture offerings to display
     * @param listener the listener notified when the user interacts with an item
     */
    public ProfileSemesterAdapter(Context context, List<Semester> semesters, List<Lecture> lectures, OnSemesterClickListener listener) {
        this.context = context;
        this.semesters = semesters;
        this.lectures = lectures;
        this.listener = listener;
    }

    @NonNull
    @Override
    public SemesterViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemLectureSemesterWithRatingBinding binding = ItemLectureSemesterWithRatingBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new SemesterViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(
            @NonNull SemesterViewHolder holder,
            int position) {

        Semester semester = semesters.get(position);
        Lecture lecture = lectures.get(position);
        holder.textView.setText(semester.semesterSeason().toString()
                + " " + semester.semesterYear());
        holder.averageRating.setText(String.format(Locale.getDefault(),
                RATING_FORMAT, lecture.averageRating));
        holder.averageRating.setTextColor(RatingColorCalculator.calculateColour(context,
                lecture.averageRating));
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

        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
        public SemesterViewHolder(@NonNull ItemLectureSemesterWithRatingBinding binding) {
            super(binding.getRoot());
            textView = binding.lectureNameForProfile;
            averageRating = binding.averageRatingBackground;
        }
    }

}
