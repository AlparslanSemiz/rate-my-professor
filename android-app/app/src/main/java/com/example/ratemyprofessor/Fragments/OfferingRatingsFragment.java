package com.example.ratemyprofessor.Fragments;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.Adapters.CommentsAdapter;
import com.example.ratemyprofessor.Adapters.ControlFlowInterface;
import com.example.ratemyprofessor.Adapters.RatingAdapter;
import com.example.ratemyprofessor.Adapters.SearchService;
import com.example.ratemyprofessor.DomainModel.Comment;
import com.example.ratemyprofessor.DomainModel.CommentModel;
import com.example.ratemyprofessor.DomainModel.CommentType;
import com.example.ratemyprofessor.DomainModel.Lecture;
import com.example.ratemyprofessor.DomainModel.Professor;
import com.example.ratemyprofessor.DomainModel.Rater;
import com.example.ratemyprofessor.DomainModel.Rating;
import com.example.ratemyprofessor.DomainModel.RatingCategory;
import com.example.ratemyprofessor.DomainModel.Semester;
import com.example.ratemyprofessor.DomainModel.VoteType;
import com.example.ratemyprofessor.R;
import com.example.ratemyprofessor.ServerCommunication.APIService;
import com.example.ratemyprofessor.ServerCommunication.AuthManager;
import com.example.ratemyprofessor.ServerCommunication.Database;
import com.example.ratemyprofessor.ServerCommunication.LoginSession;
import com.example.ratemyprofessor.ServerCommunication.ReportReason;
import com.example.ratemyprofessor.ServerCommunication.Requests.CommentReportRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.PostCommentRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.RatingRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.RatingTopicRequest;
import com.example.ratemyprofessor.ServerCommunication.Requests.SubmitAnswerRequest;
import com.example.ratemyprofessor.ServerCommunication.Responses.BasicResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.CommentsResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.RatingAverageResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.RatingCategoryResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.ServerResponse;
import com.example.ratemyprofessor.ServerCommunication.Responses.TopicAverageResponse;
import com.example.ratemyprofessor.ServerCommunication.RetrofitClient;
import com.example.ratemyprofessor.ServerCommunication.Requests.VoteRequest;
import com.example.ratemyprofessor.databinding.DialogCommentReportBinding;
import com.example.ratemyprofessor.databinding.FragmentOfferingRatingsBinding;
import com.example.ratemyprofessor.logic.RatingColorCalculator;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

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
    CommentsAdapter commentsAdapter;

    RatingAdapter ratingAdapter;

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
        binding.lectureTitle.setText(lecture.name);
        binding.term.setText(semester.getSemesterName());
        binding.commentList.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.backButton.setOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());

        getComments();
        setSubmitCommentListener();

        insertAverageRatings(lecture);
        setSubmitRatingListener();

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

    private List<Comment> commentModelToComment(List<CommentModel> models) {
        ArrayList<Comment> comments = new ArrayList<>();
        for (CommentModel model : models) {
            comments.add(new Comment(model.commentID(), model.content(), model.status(),
                    model.studentUsername(), model.lectureID(), null, model.createdAt(),
                    model.downVotes(), model.upVotes(), new ArrayList<>()));
        }
        return comments;
    }

    /**
     * Gets the comments for the offering to display them.
     */
    private void getComments() {
        Call<CommentsResponse> commentsResponseCall = apiService.getComments(lecture.id);
        if (!AuthManager.getInstance().isLoggedIn()) {
            SearchService searchService = Database.getInstance(getContext()).searchService();
            executorService.execute(() -> {
                comments = commentModelToComment(searchService.getComments(lecture.id));
                commentsAdapter = new CommentsAdapter(getContext(), comments, OfferingRatingsFragment.this, CommentType.COMMENT);
                binding.commentList.setAdapter(commentsAdapter);
            });
            Toast.makeText(getContext(), "Internet not available", Toast.LENGTH_SHORT).show();
        } else {
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
                        commentsAdapter = new CommentsAdapter(getContext(), comments, OfferingRatingsFragment.this, CommentType.COMMENT);
                        binding.commentList.setAdapter(commentsAdapter);
                    });
                }

                @Override
                public void onFailure(Call<CommentsResponse> call, Throwable throwable) {
                    Log.d(TAG, "couldn't get the comments: " + throwable.getMessage());
                }
            });
        }
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
            commentInput.getText().clear();
            commentInput.clearFocus();
            InputMethodManager imm =
                    (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(commentInput.getWindowToken(), 0);

            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            } else {
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
            }
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

        SearchService searchService = Database.getInstance(getContext()).searchService();
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            executorService.execute(new Runnable() {
                @Override
                public void run() {
                    List<Rating> ratings = searchService.getLectureRatings(lecture.id, Rater.AVERAGE);
                    List<TopicAverageResponse> topicRatings = new ArrayList<>();
                    for (Rating rating : ratings) {
                        topicRatings.add(new TopicAverageResponse(rating.category, rating.score));
                    }
                    showRatings(null, topicRatings);
                }
            });
        } else {
            ratingCall.enqueue(new Callback<RatingAverageResponse>() {
                @Override
                public void onResponse(Call<RatingAverageResponse> call,
                                       Response<RatingAverageResponse> response) {
                    RatingAverageResponse body = response.body();
                    if (!response.isSuccessful() || body == null || body.ratings() == null) {
                        Log.d(TAG, "couldn't get the ratings, status " + response.code());
                        return;
                    }

                    if (body.ratings().isEmpty()) {
                        setEmptyRating();
                        return;
                    }
                    List<TopicAverageResponse> ratings = body.ratings();
                    // Dont know why we even get "null" categories but it happens
                    ratings.removeIf(rating -> rating.category() == null);
                    Log.d("HEREHEREHERE", "BITTEEEEE");
                    updateLocalRatingsFromResponse(ratings);
                    for (TopicAverageResponse rating : ratings) {
                        System.out.println(rating.category() + "->" + rating.value());
                    }
                    executorService.execute(() -> {
                        List<Rating> storedUserRatings = searchService.getLectureRatings(lecture.id, Rater.USER);
                        List<TopicAverageResponse> userRatings = new ArrayList<>();
                        for (Rating rating : storedUserRatings) {
                            userRatings.add(new TopicAverageResponse(rating.category, rating.score));
                        }
                        runOnUiThread(() -> showRatings(ratings, formatUserRatings(ratings, userRatings)));
                    });
                }

                @Override
                public void onFailure(Call<RatingAverageResponse> call,
                                      Throwable throwable) {
                    Log.d(TAG, "couldn't get the ratings: " + throwable.getMessage());
                }
            });
        }
    }

    private void setEmptyRating() {
        Call<RatingCategoriesResponse> responseCall = apiService.getCategories(lecture.id);
        responseCall.enqueue(new Callback<RatingCategoriesResponse>() {
            @Override
            public void onResponse(Call<RatingCategoriesResponse> call, Response<RatingCategoriesResponse> response) {
                RatingCategoriesResponse body = response.body();
                Log.d(TAG, "WE ARE IN");
                if (!response.isSuccessful() || body == null || body.categories() == null) {
                    Log.d(TAG, "couldn't get the ratings, status " + response.code());
                    return;
                }
                Log.d(TAG, "WE ARE IN");

                List<TopicAverageResponse> topicRatings = new ArrayList<>();
                List<RatingCategoryResponse> categories = body.categories();
                for (RatingCategoryResponse category : categories) {
                    topicRatings.add(new TopicAverageResponse(category.category(), 0));
                }
                showRatings(topicRatings, null);
            }

            @Override
            public void onFailure(Call<RatingCategoriesResponse> call, Throwable throwable) {
                Log.d(TAG, "couldn't get the ratings: " + throwable.getMessage());
            }
        });
    }

    private List<TopicAverageResponse> formatUserRatings(List<TopicAverageResponse> ratings, List<TopicAverageResponse> userRatings) {
        List<TopicAverageResponse> finalUserRatings = new ArrayList<>();
        for (TopicAverageResponse rating : ratings) {
            TopicAverageResponse match = null;
            for (TopicAverageResponse userRating: userRatings) {
                if (userRating.category() == rating.category()) {
                    match = userRating;
                    break;
                }
            }
            if (match == null) {
                match = new TopicAverageResponse(rating.category(), 0);
            }
            finalUserRatings.add(match);
        }
        return finalUserRatings;
    }
    /**
     * Displays the loaded averages: one row per topic, plus their overall average on top.
     *
     * @param ratings the average per rating topic, possibly empty
     */
    private void showRatings(List<TopicAverageResponse> ratings, List<TopicAverageResponse> userRatings) {
        RecyclerView recyclerView = binding.ratingView;
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        ratingAdapter = new RatingAdapter(ratings, userRatings);
        recyclerView.setAdapter(ratingAdapter);

        // Nothing was rated yet, so there is no average to show either. Without this the
        // division below would produce NaN.
        if (ratings.isEmpty()) {
            binding.averageLectureRating.setText("-");
            return;
        }

        double sum = 0;
        for (TopicAverageResponse rating : ratings) {
            sum += rating.value();
        }
        double lectureRating = sum / ratings.size();
        // temporary fix, see how it should be handled later.
        if (sum == 0) {
            binding.averageLectureRating.setText("-");
            return;
        }
        binding.averageLectureRating.setText(String.format(Locale.ROOT, RATING_FORMAT, lectureRating));
        binding.averageLectureRating.setTextColor(RatingColorCalculator.calculateColour(
                binding.averageLectureRating.getContext(), lectureRating));
    }

    /**
     * Sends the updated ratings to the server
     */
    public void setSubmitRatingListener() {
        binding.submitRating.setOnClickListener(v -> {


            // Creating the Request
            Map<RatingCategory, Double> changedRatings = ratingAdapter.getChangedRatings();
            List<RatingTopicRequest> requestList = new ArrayList<>();
            for (Map.Entry<RatingCategory, Double> entry : changedRatings.entrySet()) {
                requestList.add(new RatingTopicRequest(entry.getKey(), entry.getValue()));
            }

            RatingRequest request = new RatingRequest(lecture.id, requestList);
            String token = LoginSession.from(requireContext()).bearerToken();

//            for (Map.Entry<RatingCategory, Double> entry : changedRatings.entrySet()) {
//                Log.d(TAG,entry.getKey() + " -> " + entry.getValue());
//                System.out.println(entry.getKey() + " -> " + entry.getValue());
//            }


            // (Trying to) submit the ratings
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            } else {
                apiService.submitRating(token, request).enqueue(new Callback<ServerResponse>() {
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
                        updateLocalRatingsFromRequest(requestList);
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
        }
        );
    }

    @Override
    public void onReplySend(String commentId, String reply) {
        String token = LoginSession.from(requireContext()).bearerToken();
        Log.d(TAG, "reply send " + commentId + ":" + reply);

        Call<BasicResponse> call = apiService.postAnswer(token, new SubmitAnswerRequest(commentId, reply));
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "Internet not available", Toast.LENGTH_SHORT).show();
        } else {
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
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
        } else {
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
    }

    @Override
    public void reportComment(String commentID) {
        showCommentReportDialog(commentID, CommentType.COMMENT);
    }

    @Override
    public void reportReply(String commentID) {
        showCommentReportDialog(commentID, CommentType.REPLY);
    }

    private void updateLocalRatingsFromRequest(List<RatingTopicRequest> ratingRequests) {
        SearchService searchService = Database.getInstance(getContext()).searchService();
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                for (RatingTopicRequest ratingResponse: ratingRequests){
                    Rating rating = new Rating(lecture.id, ratingResponse.category(), ratingResponse.value(), Rater.USER);
                    searchService.upsertRating(rating);
                }
            }
        });
    }
    private void updateLocalRatingsFromResponse(List<TopicAverageResponse> ratingResponses) {
        SearchService searchService = Database.getInstance(getContext()).searchService();
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                for (TopicAverageResponse ratingResponse: ratingResponses){
                    Rating rating = new Rating(lecture.id, ratingResponse.category(), ratingResponse.value(), Rater.AVERAGE);
                    searchService.upsertRating(rating);
                }
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

    /**
     * Opens the bug report dialog.
     */
    private void showCommentReportDialog(String commentID, CommentType type) {
        DialogCommentReportBinding dialogBinding = DialogCommentReportBinding.inflate(getLayoutInflater());

        ReportReason[] reasons = ReportReason.values();

        ArrayAdapter<ReportReason> adapter = new ArrayAdapter<>(
                getContext(),
                android.R.layout.simple_spinner_item,
                reasons
        );

        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);

        dialogBinding.reportReason.setAdapter(adapter);

        Dialog dialog = new MaterialAlertDialogBuilder(requireContext())
                .setView(dialogBinding.getRoot())
                .create();

        dialogBinding.bugReportCancel.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.bugReportSubmit.setOnClickListener(v -> submitCommentReport(dialogBinding, dialog, commentID, type));
        dialogBinding.commentReportInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            /**
             * Clears the empty-input error once the user starts typing.
             */
            @Override
            public void afterTextChanged(Editable s) {
                dialogBinding.bugReportInputLayout.setError(null);
            }
        });

        dialog.setOnShowListener(dialogInterface -> {
            if (dialog.getWindow() != null) {
                dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            }
        });
        dialog.show();
    }
    /**
     * Validates the bug report text before closing the dialog.
     *
     * @param dialogBinding the views of the bug report dialog
     * @param dialog        the dialog to close once the report is accepted
     */
    private void submitCommentReport(DialogCommentReportBinding dialogBinding, Dialog dialog,
                                     String commentID, CommentType type) {
        String report = dialogBinding.commentReportInput.getText() == null
                ? ""
                : dialogBinding.commentReportInput.getText().toString().trim();

        if (report.isEmpty()) {
            dialogBinding.bugReportInputLayout.setError(getString(R.string.bug_report_empty_error));
            return;
        }

        ReportReason reason = (ReportReason) dialogBinding.reportReason.getSelectedItem();
        CommentReportRequest request = new CommentReportRequest(commentID, reason, report);
        Call<BasicResponse> reportCall;
        String authToken = LoginSession.from(getContext()).bearerToken();
        if (type == CommentType.COMMENT) {
            reportCall = apiService.reportComment(authToken, request);
        } else {
            reportCall = apiService.reportReply(authToken, request);
        }
        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
        } else {
            reportCall.enqueue(new Callback<BasicResponse>() {
                @Override
                public void onResponse(Call<BasicResponse> call, Response<BasicResponse> response) {
                    BasicResponse body = response.body();
                    if (!response.isSuccessful() || body == null || !body.success()) {
                        Log.println(Log.DEBUG, "comment report", "failure: " + response.code());
                    }
                }

                @Override
                public void onFailure(Call<BasicResponse> call, Throwable throwable) {
                    Log.println(Log.DEBUG, "comment report", "failure: " + throwable.getMessage());
                }
            });
            dialogBinding.bugReportInputLayout.setError(null);
            Toast.makeText(requireContext(), R.string.bug_report_submitted, Toast.LENGTH_SHORT).show();
        }
        dialog.dismiss();
    }
}
