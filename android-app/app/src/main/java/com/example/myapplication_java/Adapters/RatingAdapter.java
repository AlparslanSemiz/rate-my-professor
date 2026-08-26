package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.RatingCategory;
import com.example.myapplication_java.ServerCommunication.Responses.TopicAverageResponse;
import com.example.myapplication_java.databinding.ItemRatingBinding;
import com.example.myapplication_java.logic.RatingColorCalculator;

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

    private List<TopicAverageResponse> ratings;

    /**
     * Used to keep track of changes the User made to his ratings, so they can be submitted later
     */
    private final Map<RatingCategory, Double> changedRatings = new HashMap<>();

    public RatingAdapter(List<TopicAverageResponse> ratings) {
        this.ratings = ratings;
    }

    public Map<RatingCategory, Double> getChangedRatings() {
//        System.out.println("Submit");
//        for (RatingCategory category : changedRatings.keySet()) {
//            System.out.println(category + "->" + changedRatings.get(category));
//        }
        return changedRatings;
    }

    @Override
    public void onRatingChanged(RatingCategory category, double rating) {
        if (category != null) {
            changedRatings.put(category, rating);
        }
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
        return new RatingViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull RatingAdapter.RatingViewHolder holder, int position) {
        TopicAverageResponse rating = ratings.get(position);
        holder.setCategory(rating.category(), this);


        holder.name.setText(rating.category().getDisplayName());
        holder.averageRating.setText(String.format(Locale.ROOT, RATING_FORMAT, rating.value()));
        holder.averageRating.setTextColor(RatingColorCalculator.calculateColour(holder.itemView.getContext(),
                rating.value()));
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
