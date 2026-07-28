package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.ServerCommunication.Responses.TopicAverageResponse;
import com.example.myapplication_java.databinding.ItemRatingBinding;
import com.example.myapplication_java.logic.RatingColorCalculator;

import java.util.List;
import java.util.Locale;

/**
 * This adapter is used to display a rating category of a lectures rating.
 *
 * <p>Each row shows two bars: the average everybody gave, which is read only, and the bar the
 * user can drag to give their own rating.</p>
 */
public class RatingAdapter extends RecyclerView.Adapter<RatingAdapter.RatingViewHolder> {

    /**
     * Format of the numbers next to the bars, always with one decimal.
     */
    private static final String RATING_FORMAT = "%.1f";

    private final List<TopicAverageResponse> ratings;

    public RatingAdapter(List<TopicAverageResponse> ratings) {
        this.ratings = ratings;
    }

    @NonNull
    @Override
    public RatingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemRatingBinding binding = ItemRatingBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new RatingViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull RatingAdapter.RatingViewHolder holder, int position) {
        TopicAverageResponse rating = ratings.get(position);

        holder.name.setText(rating.name());
        holder.averageRating.setText(String.format(Locale.ROOT, RATING_FORMAT, rating.value()));
        holder.averageRating.setTextColor(RatingColorCalculator.ratingColourCalculator(
                holder.averageRating.getContext(), rating.value()));
        holder.averageBar.setRating((float) rating.value());
    }

    @Override
    public int getItemCount() {
        return ratings.size();
    }

    /**
     * Holds the views of a single rating topic.
     */
    public static class RatingViewHolder extends RecyclerView.ViewHolder {

        final TextView name;
        final TextView averageRating;
        final RatingBar averageBar;

        final RatingBar userRatingBar;
        final TextView userRatingNum;

        public RatingViewHolder(@NonNull ItemRatingBinding binding) {
            super(binding.getRoot());
            name = binding.categoryName;
            averageRating = binding.averageRatingNum;
            averageBar = binding.ratingBarAverage;

            userRatingBar = binding.ratingBarYourRating;
            userRatingNum = binding.yourRatingNum;

            // Changing the number next to the Rating Bar in real time
            userRatingBar.setOnRatingBarChangeListener(
                    (bar, rating, fromUser) -> {
                        userRatingNum.setText(String.format(Locale.ROOT, RATING_FORMAT, rating));
                        userRatingNum.setTextColor(RatingColorCalculator.ratingColourCalculator(
                                userRatingNum.getContext(), rating));
                    }
            );
        }
    }
}
