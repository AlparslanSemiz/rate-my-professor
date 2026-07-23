package com.example.myapplication_java.Fragments;

import static android.content.Context.MODE_PRIVATE;

import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.example.myapplication_java.Adapters.RatingAdapter;
import com.example.myapplication_java.Adapters.CommentsAdapter;
import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Requests.RatingRequest;
import com.example.myapplication_java.ServerCommunication.Requests.RatingTopicRequest;
import com.example.myapplication_java.ServerCommunication.Responses.RatingAverageResponse;
import com.example.myapplication_java.ServerCommunication.Responses.TopicAverageResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.FragmentOfferingRatingsBinding;
import com.example.myapplication_java.logic.RatingColorCalculator;
import com.example.myapplication_java.ServerCommunication.Responses.CommentsResponse;
import com.example.myapplication_java.ServerCommunication.Requests.PostCommentRequest;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Response;

import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Callback;

/**
 * The rating (and comment) Screen for a lecture Offering.
 */
public class OfferingRatingsFragment extends Fragment {

    private Lecture lecture;
    private Professor professor;
    private Semester semester;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    private APIService apiService;

    private RatingAdapter ratingAdapter;

    FragmentOfferingRatingsBinding binding;

    public OfferingRatingsFragment() {
        apiService = RetrofitClient.getClient().create(APIService.class);
        // Required empty public constructor
    }

    public OfferingRatingsFragment(Professor professor, Semester semester, Lecture lecture) {
        this.lecture = lecture;
        this.professor = professor;
        this.semester = semester;
        apiService = RetrofitClient.getClient().create(APIService.class);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentOfferingRatingsBinding.inflate(inflater, container, false);
        binding.name.setText(professor.firstName);
        binding.surname.setText(professor.lastName);
        binding.commentList.setLayoutManager(new LinearLayoutManager(requireContext()));

        getComments();
        setSubmitCommentListener();

        insertAverageRatings(lecture);
        setSubmitRatingListener();

        return binding.getRoot();
    }

    /**
     * Gets the comments for the offering to display them.
     */
    private void getComments() {
        Call<CommentsResponse> commentsResponseCall = apiService.getComments(lecture.id);
        commentsResponseCall.enqueue(new Callback<CommentsResponse>() {
            @Override
            public void onResponse(Call<CommentsResponse> call, Response<CommentsResponse> response) {
                if (!response.isSuccessful()) {
                    Log.println(Log.DEBUG, "comments", "couldn't get the comments");
                    return;
                }
                List<Comment> comments = response.body().comments();
                requireActivity().runOnUiThread(() -> {
                    CommentsAdapter adapter = new CommentsAdapter(comments);
                    binding.commentList.setAdapter(adapter);
                });
            }

            @Override
            public void onFailure(Call<CommentsResponse> call, Throwable throwable) {
                Log.println(Log.DEBUG, "comments", "couldn't get the comments");
            }
        });
    }

    /**
     * sends the command to the server when the button is clicked.
     */
    private void setSubmitCommentListener() {
        EditText commentInput = binding.inputComment;
        binding.submitComment.setOnClickListener(v -> {
            String comment = commentInput.getText().toString();
            Log.println(Log.DEBUG, "submit", comment);
            SharedPreferences loginDataStorage = requireActivity().getSharedPreferences("loginData", MODE_PRIVATE);
            String token = loginDataStorage.getString("authToken", "");
            PostCommentRequest request = new PostCommentRequest(lecture.id, comment);
            apiService.postComment("Bearer " + token, request).enqueue(new Callback<ServerResponse>() {
                @Override
                public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                    if (!response.isSuccessful()) {
                        requireActivity().runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(requireContext(), "Your comment couldn't be sent.", Toast.LENGTH_SHORT).show();
                            }
                        });
                        return;
                    }
                    requireActivity().runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(requireContext(), "Your comment is sent.", Toast.LENGTH_SHORT).show();
                        }
                    });
                }

                @Override
                public void onFailure(Call<ServerResponse> call, Throwable throwable) {
                    requireActivity().runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(requireContext(), "Your cpmment couldn't be sent.", Toast.LENGTH_SHORT).show();
                        }
                    });
                }
            });

        });
    }

    private void setRatingAdapter(RatingAdapter adapter) {
        this.ratingAdapter = adapter;
    }

    /**
     * Sends the updated ratings to the server
     */
    public void setSubmitRatingListener() {
        binding.submitRating.setOnClickListener(v -> {

            // Creating the Request
            Map<String, Double> changedRatings = ratingAdapter.getChangedRatings();
            List<RatingTopicRequest> requestList = new ArrayList<>();
            for (Map.Entry<String, Double> entry : changedRatings.entrySet()) {
                requestList.add(new RatingTopicRequest(entry.getKey(), entry.getValue()));
            }
            RatingRequest request = new RatingRequest(lecture.id, requestList);
            SharedPreferences loginDataStorage = requireActivity().getSharedPreferences("loginData", MODE_PRIVATE);
            String token = loginDataStorage.getString("authToken", "");

            // (Trying to) submit the ratings
            apiService.submitRating("bearer " + token, request).enqueue(new Callback<ServerResponse>() {
                @Override
                public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                    if (!response.isSuccessful()) {
                        Toast.makeText(requireContext(),
                                "Your rating couldn't be sent.",
                                Toast.LENGTH_SHORT).show();
                        return;
                    }

                    Toast.makeText(requireContext(),
                            "Rating submitted successfully.",
                            Toast.LENGTH_SHORT).show();

                    // update View
                    insertAverageRatings(lecture);
                }

                @Override
                public void onFailure(Call<ServerResponse> call, Throwable throwable) {
                    requireActivity().runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(requireContext(), "Your rating couldn't be sent.", Toast.LENGTH_SHORT).show();
                        }
                    });
                }
            });
        }
        );
    }

    /**
     * Fetches average ratings from Server and inserts them into the view.
     * !!! Currently done on demand for a single lectureOffering once it was clicked. At some point the fetching part should be done
     * for all lectureOfferings centrally when the app is opened I think (in Database Class I guess) !!!
     */
    public void insertAverageRatings(Lecture lecture) {
        APIService apiService = RetrofitClient.getClient().create(APIService.class);
        Call<RatingAverageResponse> ratingCall = apiService.getRatings(lecture.id);
        System.out.println("id: " + lecture.id);

        ratingCall.enqueue(new retrofit2.Callback<RatingAverageResponse>() {
            @Override
            public void onResponse(Call<RatingAverageResponse> call,
                                   Response<RatingAverageResponse> response) {
                RecyclerView recyclerView = binding.ratingView;
                recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
                List<TopicAverageResponse> ratings = response.body().ratings();

                // Temporary calculation of average lecture rating on top of the screen (very dirty code ewww)
                double sum = 0;
                for (TopicAverageResponse rating : ratings) {
                    sum += rating.value();
                }
                double lectureRating = sum / ratings.size();
                binding.averageLectureRating.setText(String.format(Locale.ROOT, "%.1f", lectureRating));
                binding.averageLectureRating.setTextColor(RatingColorCalculator.ratingColourCalculator(lectureRating));


                // Creates a new Adapter when first called and then just updates the existing adapter when new
                // ratings are submitted
                if (ratingAdapter == null) {
                    ratingAdapter = new RatingAdapter(ratings);
                    recyclerView.setAdapter(ratingAdapter);
                } else {
                    ratingAdapter.updateRatings(ratings);
                }

            }

            @Override
            public void onFailure(Call<RatingAverageResponse> call,
                                  Throwable throwable) {
                System.out.println(":(");
                Log.println(Log.DEBUG, "Database update failure", throwable.getMessage());
            }
        });
    }
}