package com.example.ratemyprofessor.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingDto;
import com.example.ratemyprofessor.databinding.ItemUserRatingBinding;
import com.example.ratemyprofessor.logic.RatingColorCalculator;

import java.util.List;
import java.util.Locale;

/**
 * Adapter for "List of my Ratings"-tab
 */
public class ListOfMyRatingsAdapter extends RecyclerView.Adapter<ListOfMyRatingsAdapter.UserRatingViewHolder>{

    private final List<UserRatingDto> ratings;

    private final OnRatingClickListener listener;

    @NonNull
    @Override
    public ListOfMyRatingsAdapter.UserRatingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemUserRatingBinding binding = ItemUserRatingBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new ListOfMyRatingsAdapter.UserRatingViewHolder(binding);
    }

    /**
     * Creates a ListOfMyRatingsAdapter with the supplied data and interaction listener.
     *
     * @param ratings the ratings to display
     * @param listener the listener notified when the user interacts with an item
     */
    public ListOfMyRatingsAdapter(List<UserRatingDto> ratings, OnRatingClickListener listener) {
        this.ratings = ratings;
        this.listener = listener;
    }

    @Override
    public void onBindViewHolder(@NonNull ListOfMyRatingsAdapter.UserRatingViewHolder holder, int position) {
        UserRatingDto rating = ratings.get(position);
        holder.averageRating.setText(String.format(Locale.ROOT,"%.1f", rating.overallRating()));
        holder.averageRating.setTextColor(RatingColorCalculator.calculateColour(holder.itemView.getContext(), rating.overallRating()));
        holder.lectureName.setText(rating.lecture().name());
        holder.semester.setText(
                holder.itemView.getContext().getString(
                        R.string.semester,
                        rating.lecture().semesterSeason().name(),
                        rating.lecture().semesterYear()
                )
        );

        Semester semesterObject = new Semester(rating.lecture().semesterYear(), rating.lecture().semesterSeason());
        String profId = rating.lecture().professors().get(0).id(); // Currently just choosing the first prof if multiple profs
        String lectureName = rating.lecture().name();

        holder.itemView.setOnClickListener(v -> listener.onRatingClick(semesterObject, profId, lectureName));
    }

    @Override
    public int getItemCount() {
        return ratings.size();
    }

    /**
     * Holds the views used to display a single user rating item.
     */
    public static class UserRatingViewHolder extends RecyclerView.ViewHolder {

        final TextView lectureName;
        final TextView averageRating;
        final TextView semester;
        /**
         * Creates a view holder backed by the supplied item binding.
         *
         * @param binding the view binding for the item layout
         */
        public UserRatingViewHolder(@NonNull ItemUserRatingBinding binding) {
            super(binding.getRoot());

            lectureName = binding.lectureName;
            averageRating = binding.averageRatingGiven;
            semester = binding.semester;
        }

    }
}
