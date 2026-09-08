package com.example.ratemyprofessor.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.DomainModel.RatingCategory;
import com.example.ratemyprofessor.ServerCommunication.Responses.TopicAverageResponse;
import com.example.ratemyprofessor.databinding.ItemRatingBinding;
import com.example.ratemyprofessor.logic.RatingColorCalculator;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * This adapter is used to display a rating category of a lectures rating.
 *
 * <p>Each row shows two bars: the average everybody gave, which is read only, and the bar the
 * user can drag to give their own rating.</p>
 */
public class RatingAdapter extends RecyclerView.Adapter<RatingAdapter.RatingViewHolder> implements OnRatingChangedListener{

    /**
     * Format of the numbers next to the bars, always with one decimal.
     */
    private static final String RATING_FORMAT = "%.1f";

    private ArrayList<TopicAverageResponse> ratings;
    private ArrayList<TopicAverageResponse> userRatings;

    /**
     * Used to keep track of changes the User made to his ratings, so they can be submitted later
     */
    private Map<RatingCategory, Double> changedRatings;

    /**
     * Constructor for the rating adapter. Removes "overall" rating from each list
     */
    public RatingAdapter(ArrayList<TopicAverageResponse> ratings, ArrayList<TopicAverageResponse> userRatings) {
        this.ratings = ratings;
        this.userRatings = userRatings;
        changedRatings = new HashMap<>();
        if (userRatings != null) {
            for (TopicAverageResponse rating : this.userRatings) {
                changedRatings.put(rating.category(), rating.value());
            }
        }
    }

    public Map<RatingCategory, Double> getChangedRatings() {
        return changedRatings;
    }

    public List<TopicAverageResponse> getRatings() {
        return ratings;
    }

    @Override
    public void onRatingChanged(RatingCategory category, double rating) {
        if (category != null) {
            changedRatings.put(category, rating);
        }
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
        TopicAverageResponse rating;
        TopicAverageResponse userRating;


        if (userRatings != null) {
            userRating = userRatings.get(position);
            holder.setCategory(userRating.category(), this);
            holder.name.setText(userRating.category().getDisplayName());
            holder.userRating.setText(String.format(Locale.ROOT, RATING_FORMAT, userRating.value()));
            holder.userRating.setTextColor(RatingColorCalculator.calculateColour(holder.itemView.getContext(),
                    userRating.value()));
            holder.userRatingBar.setRating((float) userRating.value());
        }
        if (ratings != null) {
            rating = ratings.get(position);
            holder.setCategory(rating.category(), this);
            holder.name.setText(rating.category().getDisplayName());
            holder.averageRating.setText(String.format(Locale.ROOT, RATING_FORMAT, rating.value()));
            holder.averageRating.setTextColor(RatingColorCalculator.calculateColour(holder.itemView.getContext(),
                    rating.value()));
            holder.averageBar.setRating((float) rating.value());
        }
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
        final TextView userRating;
        final RatingBar averageBar;
        final RatingBar userRatingBar;
        final TextView userRatingNum;

        public RatingViewHolder(@NonNull ItemRatingBinding binding) {
            super(binding.getRoot());

            name = binding.categoryName;
            averageRating = binding.averageRatingNum;
            userRating = binding.yourRatingNum;
            averageBar = binding.ratingBarAverage;
            userRatingBar = binding.ratingBarYourRating;
            userRatingNum = binding.yourRatingNum;
        }

        public void setCategory(RatingCategory category, OnRatingChangedListener listener) {

            userRatingBar.setOnRatingBarChangeListener(
                    (bar, rating, fromUser) -> {
                        if (fromUser) {
                            userRatingNum.setText(String.valueOf((double) rating));
                            userRatingNum.setTextColor(RatingColorCalculator.calculateColour(bar.getContext(), rating));

                            listener.onRatingChanged(category, rating);
                        }
                    }
            );
        }
    }
}
