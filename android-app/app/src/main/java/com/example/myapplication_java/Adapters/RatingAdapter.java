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

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * This adapter is used to display a rating category of a lectures rating.
 */
public class RatingAdapter extends RecyclerView.Adapter<RatingAdapter.RatingViewHolder> implements OnRatingChangedListener{
    private List<TopicAverageResponse> ratings;

    /**
     * Used to keep track of changes the User made to his ratings, so they can be submitted later
     */
    private final Map<String, Double> changedRatings = new HashMap<>();

    public RatingAdapter(List<TopicAverageResponse> ratings) {
        this.ratings = ratings;
    }

    public Map<String, Double> getChangedRatings() {
        return changedRatings;
    }

    @Override
    public void onRatingChanged(String name, double rating) {
        changedRatings.put(name, rating);
        System.out.println("name: " + name + ", value: " + rating);
    }

    public void updateRatings(List<TopicAverageResponse> newRatings) {
        this.ratings = newRatings;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public RatingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemRatingBinding binding = ItemRatingBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new RatingViewHolder(binding, this);
    }

    @Override
    public void onBindViewHolder(@NonNull RatingAdapter.RatingViewHolder holder, int position) {
        TopicAverageResponse rating = ratings.get(position);

        changedRatings.put(rating.name(), rating.value());

        holder.name.setText(rating.name());
        holder.averageRating.setText(String.format(Locale.ROOT, "%.1f", rating.value()));
        holder.averageRating.setTextColor(RatingColorCalculator.ratingColourCalculator(rating.value()));
        holder.averageBar.setRating((float) rating.value());

        System.out.println(rating.name() + " " + rating.value());

    }

    @Override
    public int getItemCount() {
        return ratings.size();
    }

    public static class RatingViewHolder extends RecyclerView.ViewHolder {

        TextView name;
        TextView averageRating;

        RatingBar averageBar;

        RatingBar userRatingBar;
        TextView userRatingNum;

        public RatingViewHolder(@NonNull ItemRatingBinding binding, OnRatingChangedListener listener) {
            super(binding.getRoot());
            name = binding.categoryName;
            averageRating = binding.averageRatingNum;
            averageBar = binding.ratingBarAverage;

            userRatingBar = binding.ratingBarYourRating;
            userRatingNum = binding.yourRatingNum;

            // Handling a changed User Rating
            userRatingBar.setOnRatingBarChangeListener(
                    (bar, rating, fromUser) -> {
                        userRatingNum.setText(String.valueOf((double) rating));
                        userRatingNum.setTextColor(RatingColorCalculator.ratingColourCalculator(rating));
                        listener.onRatingChanged(name.getText().toString(), rating);
                    }
            );
        }
    }
}
