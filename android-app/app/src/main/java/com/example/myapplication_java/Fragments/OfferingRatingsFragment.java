package com.example.myapplication_java.Fragments;

import static android.content.Context.MODE_PRIVATE;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.Adapters.RatingAdapter;
import com.example.myapplication_java.Adapters.CommentsAdapter;
import com.example.myapplication_java.DomainModel.Comment;
import com.example.myapplication_java.DomainModel.CommentType;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.DomainModel.VoteType;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.BasicResponse;
import com.example.myapplication_java.ServerCommunication.Responses.RatingAverageResponse;
import com.example.myapplication_java.ServerCommunication.Responses.TopicAverageResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.ServerCommunication.SubmitAnswerRequest;
import com.example.myapplication_java.ServerCommunication.VoteRequest;
import com.example.myapplication_java.databinding.FragmentOfferingRatingsBinding;
import com.example.myapplication_java.logic.RatingColorCalculator;
import com.example.myapplication_java.ServerCommunication.Responses.CommentsResponse;
import com.example.myapplication_java.ServerCommunication.PostCommentRequest;
import com.example.myapplication_java.ServerCommunication.Responses.ServerResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Response;

import retrofit2.Callback;

/**
 * The rating (and comment) Screen for a lecture Offering.
 *
 * <p>Last step of the selection: professor, semester and lecture are all known here, so this
 * screen loads the ratings and comments belonging to exactly that offering.</p>
 */
public class OfferingRatingsFragment extends Fragment implements CommentsAdapter.OnCommentClickListener {

    private static final String TAG = "OfferingRatings";

    /**
     * Format of the average shown on top of the screen, always with one decimal.
     */
    private static final String RATING_FORMAT = "%.1f";

    private Lecture lecture;
    private Professor professor;

    private ControlFlowInterface flowInterface;
    /**
     * Part of the offering identity. Not displayed yet, the header currently only shows the
     * professor.
     */
    private Semester semester;

    private final APIService apiService;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    FragmentOfferingRatingsBinding binding;

    /**
     * The displayed comments. Answers are inserted into and removed from this same list when
     * the user folds them out, which is why it has to stay modifiable.
     */
    List<Comment> comments;
    CommentsAdapter adapter;

    public OfferingRatingsFragment() {
        apiService = RetrofitClient.getClient().create(APIService.class);
        // Required empty public constructor
    }

    /**
     * @param professor the professor holding the offering
     * @param semester  the semester it is held in
     * @param lecture   the offering whose ratings and comments are shown
     */
    public OfferingRatingsFragment(Professor professor, Semester semester, Lecture lecture) {
        this.lecture = lecture;
        this.professor = professor;
        this.semester = semester;
        apiService = RetrofitClient.getClient().create(APIService.class);
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

        return binding.getRoot();
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        if (context instanceof ControlFlowInterface) {
            flowInterface = (ControlFlowInterface) context;
        } else {
            throw new RuntimeException(context + "must implement ControlFlowInterface");
        }
    }

    /**
     * Gets the comments for the offering to display them.
     */
    private void getComments() {
        Call<CommentsResponse> commentsResponseCall = apiService.getComments(lecture.id);
        commentsResponseCall.enqueue(new Callback<CommentsResponse>() {
            @Override
            public void onResponse(Call<CommentsResponse> call, Response<CommentsResponse> response) {
                CommentsResponse body = response.body();
                if (!response.isSuccessful() || body == null || body.comments() == null) {
                    Log.d(TAG, "couldn't get the comments");
                    return;
                }

                // Copied into an own list, because folding answers in and out modifies it.
                comments = new ArrayList<>(body.comments());
                runOnUiThread(() -> {
                    adapter = new CommentsAdapter(comments, OfferingRatingsFragment.this, CommentType.COMMENT);
                    binding.commentList.setAdapter(adapter);
                });
            }

            @Override
            public void onFailure(Call<CommentsResponse> call, Throwable throwable) {
                Log.d(TAG, "couldn't get the comments: " + throwable.getMessage());
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
            Log.d(TAG, "submit " + comment);

            PostCommentRequest request = new PostCommentRequest(lecture.id, comment);
            String token = LoginSession.from(requireContext()).bearerToken();

            apiService.postComment(token, request).enqueue(new Callback<ServerResponse>() {
                @Override
                public void onResponse(Call<ServerResponse> call, Response<ServerResponse> response) {
                    if (!response.isSuccessful()) {
                        showToast("Your comment couldn't be sent.");
                        return;
                    }
                    showToast("Your comment is sent.");
                }

                @Override
                public void onFailure(Call<ServerResponse> call, Throwable throwable) {
                    showToast("Your comment couldn't be sent.");
                }
            });

        });
    }

    /**
     * Fetches average ratings from Server and inserts them into the view.
     * !!! Currently done on demand for a single lectureOffering once it was clicked. At some point the fetching part should be done
     * for all lectureOfferings centrally when the app is opened I think (in Database Class I guess) !!!
     *
     * @param lecture the offering the averages are loaded for
     */
    public void insertAverageRatings(Lecture lecture) {
        Call<RatingAverageResponse> ratingCall = apiService.getRatings(lecture.id);
        Log.d(TAG, "loading ratings for id: " + lecture.id);

        ratingCall.enqueue(new retrofit2.Callback<RatingAverageResponse>() {
            @Override
            public void onResponse(Call<RatingAverageResponse> call,
                                   Response<RatingAverageResponse> response) {
                RatingAverageResponse body = response.body();
                if (!response.isSuccessful() || body == null || body.ratings() == null) {
                    Log.d(TAG, "couldn't get the ratings, status " + response.code());
                    return;
                }

                List<TopicAverageResponse> ratings = body.ratings();
                runOnUiThread(() -> showRatings(ratings));
            }

            @Override
            public void onFailure(Call<RatingAverageResponse> call,
                                  Throwable throwable) {
                Log.d(TAG, "couldn't get the ratings: " + throwable.getMessage());
            }
        });
    }

    /**
     * Displays the loaded averages: one row per topic, plus their overall average on top.
     *
     * @param ratings the average per rating topic, possibly empty
     */
    private void showRatings(List<TopicAverageResponse> ratings) {
        RecyclerView recyclerView = binding.ratingView;
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerView.setAdapter(new RatingAdapter(ratings));

        // Nothing was rated yet, so there is no average to show either. Without this the
        // division below would produce NaN.
        if (ratings.isEmpty()) {
            binding.averageLectureRating.setText("-");
            return;
        }

        // Temporary calculation of average lecture rating on top of the screen (very dirty code ewww)
        // I think it looks cool <3.
        double sum = 0;
        for (TopicAverageResponse rating : ratings) {
            sum += rating.value();
        }
        double lectureRating = sum / ratings.size();
        binding.averageLectureRating.setText(String.format(Locale.ROOT, RATING_FORMAT, lectureRating));
        binding.averageLectureRating.setTextColor(RatingColorCalculator.ratingColourCalculator(
                binding.averageLectureRating.getContext(), lectureRating));
    }

    @Override
    public void onReplySend(String commentId, String reply) {
        String token = LoginSession.from(requireContext()).bearerToken();
        Log.d(TAG, "reply send " + commentId + ":" + reply);

        Call<BasicResponse> call = apiService.postAnswer(token, new SubmitAnswerRequest(commentId, reply));
        call.enqueue(new Callback<BasicResponse>() {
            @Override
            public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                if (!response.isSuccessful()) {
                    showToast("Error while replying.");
                } else {
                    showToast("Reply sent.");
                }
            }

            @Override
            public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                showToast("Couldn't connect the server.");
            }
        });
    }

    /**
     * Inserts the answers of a comment right below it.
     */
    @SuppressLint("NotifyDataSetChanged")
    @Override
    public void onOpenReplies(Comment comment) {
        flowInterface.openReplyFragment(comment);
    }

    @Override
    public void vote(String commentID, VoteType voteType, CommentType commentType) {
        LoginSession session = LoginSession.from(getContext());
        String authToken = session.bearerToken();
        Call<BasicResponse> call;
        if (commentType == CommentType.COMMENT) {
            call = apiService.voteComment(authToken, commentID, new VoteRequest(voteType));
        } else {
            call = apiService.voteAnswer(authToken, commentID, new VoteRequest(voteType));
        }
        call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                if (!response.isSuccessful()) {
                    Toast.makeText(getContext(), "Vote couldn't be sent.", Toast.LENGTH_SHORT);
                }
            }

            @Override
            public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                Toast.makeText(getContext(), "Vote couldn't be sent.", Toast.LENGTH_SHORT);
            }
        });
    }

    /**
     * Shows a short message to the user, if the screen is still on display.
     *
     * <p>Server answers arrive on a background thread, and a Toast only appears once show()
     * is called on it.</p>
     *
     * @param message the text to show
     */
    private void showToast(String message) {
        runOnUiThread(() ->
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
        );
    }

    /**
     * Runs the given action on the UI thread, but only while the fragment is still attached.
     *
     * <p>A server answer can arrive after the user already left this screen, at which point
     * touching the views would crash.</p>
     *
     * @param action the view update to run
     */
    private void runOnUiThread(Runnable action) {
        if (!isAdded()) {
            return;
        }

        requireActivity().runOnUiThread(() -> {
            if (binding != null) {
                action.run();
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
