package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.R;
import com.example.myapplication_java.ServerCommunication.Responses.TopicAverageResponse;
import com.example.myapplication_java.logic.RatingColorCalculator;

import java.util.List;

/**
 * This adapter is used to display a rating category of a lectures rating.
 */
public class RatingAdapter extends RecyclerView.Adapter<RatingAdapter.RatingViewHolder> {
    private List<TopicAverageResponse> ratings;

    public RatingAdapter(List<TopicAverageResponse> ratings) {
        this.ratings = ratings;
    }

    @NonNull
    @Override
    public RatingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_rating, parent, false);

        return new RatingViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RatingAdapter.RatingViewHolder holder, int position) {
        TopicAverageResponse rating = ratings.get(position);

        holder.name.setText(rating.name());
        holder.averageRating.setText(String.valueOf(rating.value()));
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

        public RatingViewHolder(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.category_name);
            averageRating = itemView.findViewById(R.id.average_rating_num);
            averageBar = itemView.findViewById(R.id.ratingBar_average);

            userRatingBar = itemView.findViewById(R.id.ratingBar_your_rating);
            userRatingNum = itemView.findViewById(R.id.your_rating_num);

            // Changing the number next to the Rating Bar in real time
            userRatingBar.setOnRatingBarChangeListener(
                    (bar, rating, fromUser) -> {
                        userRatingNum.setText(String.valueOf((double) rating));
                        userRatingNum.setTextColor(RatingColorCalculator.ratingColourCalculator(rating));
                    }
            );
        }
    }
}
