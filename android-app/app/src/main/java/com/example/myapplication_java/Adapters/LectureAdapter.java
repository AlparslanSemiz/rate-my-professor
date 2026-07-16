package com.example.myapplication_java.Adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.R;
import com.example.myapplication_java.databinding.ItemCommentBinding;
import com.example.myapplication_java.databinding.ItemLectureNameBinding;

import java.util.List;

/**
 * The adapter for lectures in {@link com.example.myapplication_java.Fragments.SelectionFragment}
 */
public class LectureAdapter extends RecyclerView.Adapter<LectureAdapter.LectureViewHolder> {

    private List<Lecture> lectures;
    private OnLectureClickListener listener;

    public LectureAdapter(List<Lecture> lectures, OnLectureClickListener listener) {
        this.lectures = lectures;
        this.listener = listener;
    }

    @NonNull
    @Override
    public LectureViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemLectureNameBinding binding = ItemLectureNameBinding.inflate(LayoutInflater.from(parent.getContext()),
                parent,false);
        return new LectureViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull LectureViewHolder holder, int position) {
        Lecture lecture = lectures.get(position);
        holder.textView.setText(lecture.name);
        holder.itemView.setOnClickListener(v -> listener.onLectureClick(lecture.name));
    }

    @Override
    public int getItemCount() {
        return lectures.size();
    }

    public static class LectureViewHolder extends RecyclerView.ViewHolder {

        TextView textView;
        ItemLectureNameBinding binding;
        public LectureViewHolder(@NonNull ItemLectureNameBinding binding) {
            super(binding.getRoot());
            textView = binding.semesterName;
        }
    }
    public interface OnLectureClickListener {
        void onLectureClick(String lectureTitle);
    }

    /**
     * This method is used to update the list of lectures on runtime.
     * @param lectures
     */
    public void setData(List<Lecture> lectures) {
        this.lectures = lectures;
        notifyDataSetChanged();
    }
}