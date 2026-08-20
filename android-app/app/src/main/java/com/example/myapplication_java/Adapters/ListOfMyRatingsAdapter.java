package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.ServerCommunication.Responses.TopicAverageResponse;
import com.example.myapplication_java.ServerCommunication.Responses.UserRatingDto;
import com.example.myapplication_java.databinding.ItemRatingBinding;
import com.example.myapplication_java.databinding.ItemUserRatingBinding;
import com.example.myapplication_java.logic.RatingColorCalculator;

import java.util.List;
import java.util.Locale;

public class ListOfMyRatingsAdapter extends RecyclerView.Adapter<ListOfMyRatingsAdapter.UserRatingViewHolder>{

    private final List<UserRatingDto> ratings;

    @NonNull
    @Override
    public ListOfMyRatingsAdapter.UserRatingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemUserRatingBinding binding = ItemUserRatingBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new ListOfMyRatingsAdapter.UserRatingViewHolder(binding);
    }

    public ListOfMyRatingsAdapter(List<UserRatingDto> ratings) {
        this.ratings = ratings;
    }

    @Override
    public void onBindViewHolder(@NonNull ListOfMyRatingsAdapter.UserRatingViewHolder holder, int position) {
        UserRatingDto rating = ratings.get(position);
        holder.averageRating.setText(String.format(Locale.ROOT,"%.1f", rating.overallRating()));
        holder.averageRating.setTextColor(RatingColorCalculator.ratingColourCalculator(holder.itemView.getContext(), rating.overallRating()));
        holder.lectureName.setText(rating.lectureName());
        holder.semester.setText(rating.semester());
    }

    @Override
    public int getItemCount() {
        return ratings.size();
    }

    public static class UserRatingViewHolder extends RecyclerView.ViewHolder {

        final TextView lectureName;
        final TextView averageRating;
        final TextView semester;
        public UserRatingViewHolder(@NonNull ItemUserRatingBinding binding) {
            super(binding.getRoot());

            lectureName = binding.lectureName;
            averageRating = binding.averageRatingGiven;
            semester = binding.semester;
        }

    }
}
