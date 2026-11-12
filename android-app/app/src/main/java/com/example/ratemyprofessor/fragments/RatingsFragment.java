package com.example.ratemyprofessor.fragments;

import static android.view.View.INVISIBLE;

import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.adapters.CommentsAdapter;
import com.example.ratemyprofessor.adapters.ControlFlowInterface;
import com.example.ratemyprofessor.adapters.RatingAdapter;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.CommentModel;
import com.example.ratemyprofessor.domain.CommentType;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Rater;
import com.example.ratemyprofessor.domain.Rating;
import com.example.ratemyprofessor.domain.RatingCategory;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.VoteType;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.AuthManager;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.requests.PostCommentRequest;
import com.example.ratemyprofessor.servercommunication.requests.RatingRequest;
import com.example.ratemyprofessor.servercommunication.requests.RatingTopicRequest;
import com.example.ratemyprofessor.servercommunication.responses.CommentsResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.LectureResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingAverageResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoriesResponse;
import com.example.ratemyprofessor.servercommunication.responses.RatingCategoryResponse;
import com.example.ratemyprofessor.servercommunication.responses.ServerResponse;
import com.example.ratemyprofessor.servercommunication.responses.TopicAverageResponse;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.FragmentRatingsBinding;
import com.example.ratemyprofessor.logic.CommentHelper;
import com.example.ratemyprofessor.logic.RatingColorCalculator;

import java.util.ArrayList;
import java.util.Comparator;
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
public class RatingsFragment extends Fragment implements CommentsAdapter.OnCommentClickListener {

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
    private SearchService searchService;
    FragmentRatingsBinding binding;

    List<Comment> comments;
    CommentsAdapter commentsAdapter;
    private boolean serverCommentsLoaded;

    RatingAdapter ratingAdapter;

    /**
     * Creates an empty fragment for Android lifecycle instantiation.
     */
    public RatingsFragment() {
        apiService = RetrofitClient.getClient().create(APIService.class);
        // Required empty public constructor
    }

    /**
     * Creates a RatingsFragment with the supplied values.
     *
     * @param professor the professor holding the offering
     * @param semester  the semester it is held in
     * @param lecture   the offering whose ratings and comments are shown
     */
    public RatingsFragment(Professor professor, Semester semester, Lecture lecture) {
        this.lecture = lecture;
        this.professor = professor;
        this.semester = semester;
        apiService = RetrofitClient.getClient().create(APIService.class);
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentRatingsBinding.inflate(inflater, container, false);
        searchService = Database.getInstance(requireContext()).searchService();
        binding.lectureTitle.setText(lecture.name);
        binding.term.setText(semester.getSemesterName());
        binding.commentList.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.backButton.setOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());

        binding.cancelComment.setVisibility(INVISIBLE);
        binding.submitComment.setEnabled(false);

        binding.inputComment.setOnFocusChangeListener((view, hasFocus) -> binding.cancelComment.setVisibility(
                hasFocus ? View.VISIBLE : View.INVISIBLE
        ));


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

    private List<Comment> commentModelsToComments(
            SearchService searchService,
            List<CommentModel> models
    ) {
        List<Comment> cachedComments = new ArrayList<>();
        for (CommentModel model : models) {
            List<Comment> replies = new ArrayList<>();
            for (CommentModel reply : searchService.getReplies(model.commentID())) {
                replies.add(commentModelToComment(reply, new ArrayList<>()));
            }
            cachedComments.add(commentModelToComment(model, replies));
        }
        return cachedComments;
    }

    private Comment commentModelToComment(CommentModel model, List<Comment> replies) {
        return new Comment(
                model.commentID(),
                model.content(),
                model.status(),
                model.studentUsername(),
                model.lectureID(),
                null,
                model.createdAt(),
                model.downVotes(),
                model.upVotes(),
                null, // vorerst
                replies
        );
    }

    private List<CommentModel> commentsToModels(List<Comment> serverComments) {
        List<CommentModel> models = new ArrayList<>();
        for (Comment comment : serverComments) {
            models.add(commentToModel(comment, null));
            if (comment.answers() != null) {
                for (Comment reply : comment.answers()) {
                    models.add(commentToModel(reply, comment.commentID()));
                }
            }
        }
        return models;
    }

    private CommentModel commentToModel(Comment comment, String parentId) {
        return new CommentModel(
                comment.commentID(),
                parentId,
                comment.content(),
                comment.status(),
                comment.studentUsername(),
                comment.lectureID(),
                comment.createdAt(),
                comment.downVotes(),
                comment.upVotes()
        );
    }

    private void showComments(List<Comment> commentsToShow) {
        if (binding == null) {
            return;
        }
        comments = commentsToShow;
        commentsAdapter = new CommentsAdapter(
                requireContext(),
                comments,
                RatingsFragment.this,
                CommentType.COMMENT
        );
        binding.commentList.setAdapter(commentsAdapter);
    }

    /**
     * Gets the comments for the offering to display them.
     */
    private void getComments() {
        SearchService searchService = Database.getInstance(requireContext()).searchService();
        executorService.execute(() -> {
            List<Comment> cachedComments = commentModelsToComments(
                    searchService,
                    searchService.getComments(lecture.id)
            );
            runOnUiThread(() -> {
                if (!serverCommentsLoaded) {
                    showComments(cachedComments);
                }
            });
        });

        if (!AuthManager.getInstance().isLoggedIn()) {
            return;
        }
        LoginSession session = LoginSession.from(requireContext());

        Call<CommentsResponse> commentsResponseCall = apiService.getComments(session.bearerToken() ,lecture.id);
        commentsResponseCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<CommentsResponse> call, @NonNull Response<CommentsResponse> response) {
                CommentsResponse body = response.body();
                if (!response.isSuccessful() || body == null || body.comments() == null) {
                    Log.d(TAG, "couldn't get the comments");
                    return;
                }

                serverCommentsLoaded = true;
                List<Comment> freshComments = new ArrayList<>(body.comments());
                showComments(freshComments);

                List<CommentModel> models = commentsToModels(freshComments);
                executorService.execute(() -> searchService.replaceCommentsForLecture(
                        lecture.id,
                        models
                ));
            }

            @Override
            public void onFailure(@NonNull Call<CommentsResponse> call, @NonNull Throwable throwable) {
                Log.d(TAG, "couldn't get the comments: " + throwable.getMessage());
            }
        });
    }

    /**
     * sends the command to the server when the button is clicked.
     */
    private void setSubmitCommentListener() {
        EditText commentInput = binding.inputComment;

        // checking if user is currently writing a comment
        binding.inputComment.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence text, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence text, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable text) {
                boolean hasText = !text.toString().trim().isEmpty();

                binding.submitComment.setEnabled(hasText);
            }
        });
        binding.cancelComment.setOnClickListener(v -> {
            commentInput.getText().clear();
            commentInput.clearFocus();
            InputMethodManager imm = (InputMethodManager)
                    requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(commentInput.getWindowToken(), 0);
        });

        binding.submitComment.setOnClickListener(v -> {
            String comment = commentInput.getText().toString();
            Log.d(TAG, "submit " + comment);

            PostCommentRequest request = new PostCommentRequest(lecture.id, comment);
            String token = LoginSession.from(requireContext()).bearerToken();
            commentInput.getText().clear();
            commentInput.clearFocus();
            InputMethodManager imm =
                    (InputMethodManager) requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(commentInput.getWindowToken(), 0);

            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            } else {
                apiService.postComment(token, request).enqueue(new Callback<>() {
                    @Override
                    public void onResponse(@NonNull Call<ServerResponse> call, @NonNull Response<ServerResponse> response) {
                        if (!response.isSuccessful()) {
                            showToast("Your comment couldn't be sent.");
                            return;
                        }
                        showToast("Your comment is sent.");
                    }

                    @Override
                    public void onFailure(@NonNull Call<ServerResponse> call, @NonNull Throwable throwable) {
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
    private void insertAverageRatings(Lecture lecture) {
        Call<RatingAverageResponse> ratingCall = apiService.getRatings(lecture.id);
        Log.d(TAG, "loading ratings for id: " + lecture.id);

        SearchService searchService = Database.getInstance(getContext()).searchService();
        loadCachedRatings(searchService, lecture);

        if (!AuthManager.getInstance().isLoggedIn()) {
            Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            executorService.execute(() -> {
                List<Rating> ratings = searchService.getLectureRatings(lecture.id, Rater.AVERAGE);
                List<TopicAverageResponse> topicRatings = new ArrayList<>();
                for (Rating rating : ratings) {
                    if (!rating.category.equals(RatingCategory.OVERALL)) {
                        topicRatings.add(new TopicAverageResponse(rating.category, rating.score));
                    }
                }
                showRatings(topicRatings, null);
            });
        } else {
            ratingCall.enqueue(new Callback<>() {
                @Override
                public void onResponse(@NonNull Call<RatingAverageResponse> call,
                                       @NonNull Response<RatingAverageResponse> response) {
                    RatingAverageResponse body = response.body();
                    if (!response.isSuccessful() || body == null || body.ratings() == null) {
                        Log.d(TAG, "couldn't get the ratings, status " + response.code());
                        return;
                    }

                    List<TopicAverageResponse> ratings = new ArrayList<>(body.ratings());
                    // Dont know why we even get "null" categories but it happens
                    ratings.removeIf(rating -> rating.category() == null);
                    ratings.removeIf(rating -> rating.category().equals(RatingCategory.OVERALL));
                    updateLocalRatingsFromResponse(ratings);
                    if (ratings.isEmpty()) {
                        setEmptyRating();
                        return;
                    }
                    loadOwnRatings(ratings);
                }

                @Override
                public void onFailure(@NonNull Call<RatingAverageResponse> call,
                                      @NonNull Throwable throwable) {
                    Log.d(TAG, "couldn't get the ratings: " + throwable.getMessage());
                }
            });
        }
    }


    private void loadOwnRatings(List<TopicAverageResponse> averageRatings) {
        String token = LoginSession.from(requireContext()).bearerToken();

        apiService.getOwnRatings(token, lecture.id)
                .enqueue(new Callback<>() {
                    @Override
                    public void onResponse(
                            @NonNull Call<RatingAverageResponse> call,
                            @NonNull Response<RatingAverageResponse> response
                    ) {
                        RatingAverageResponse body = response.body();

                        if (!response.isSuccessful()
                                || body == null
                                || body.ratings() == null) {
                            loadCachedUserRatings(averageRatings);
                            return;
                        }

                        List<TopicAverageResponse> ownRatings =
                                new ArrayList<>(body.ratings());

                        ownRatings.removeIf(rating ->
                                rating.category() == null
                                        || rating.category() == RatingCategory.OVERALL
                        );

                        updateLocalUserRatings(ownRatings);

                        runOnUiThread(() ->
                                showRatings(
                                        averageRatings,
                                        formatUserRatings(averageRatings, ownRatings)
                                )
                        );
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call<RatingAverageResponse> call,
                            @NonNull Throwable throwable
                    ) {
                        loadCachedUserRatings(averageRatings);
                    }
                });
    }

    /**
     * Is used to load the users own local ratings for each category
     * @param averageRatings
     */
    private void loadCachedUserRatings(
            List<TopicAverageResponse> averageRatings
    ) {
        SearchService searchService =
                Database.getInstance(requireContext()).searchService();

        executorService.execute(() -> {
            List<Rating> storedRatings =
                    searchService.getLectureRatings(lecture.id, Rater.USER);

            List<TopicAverageResponse> ownRatings = new ArrayList<>();

            for (Rating rating : storedRatings) {
                if (rating.category != RatingCategory.OVERALL) {
                    ownRatings.add(new TopicAverageResponse(
                            rating.category,
                            rating.score
                    ));
                }
            }

            runOnUiThread(() -> {
                if (ownRatings.isEmpty()) {
                    showRatings(averageRatings, null);
                } else {
                    showRatings(
                            averageRatings,
                            formatUserRatings(averageRatings, ownRatings)
                    );
                }
            });
        });
    }

    private void loadCachedRatings(SearchService searchService, Lecture lecture) {
        executorService.execute(() -> {
            List<Rating> storedAverages = searchService.getLectureRatings(lecture.id, Rater.AVERAGE);
            List<Rating> storedUserRatings = searchService.getLectureRatings(lecture.id, Rater.USER);
            List<TopicAverageResponse> average = new ArrayList<>();
            List<TopicAverageResponse> userRatings = new ArrayList<>();

            for (Rating rating : storedAverages) {
                if (rating.category != RatingCategory.OVERALL) {
                    average.add(new TopicAverageResponse(rating.category, rating.score));
                }
            }
            for (Rating rating : storedUserRatings) {
                if (rating.category != RatingCategory.OVERALL) {
                    userRatings.add(new TopicAverageResponse(rating.category, rating.score));
                }
            }

            if (!average.isEmpty()) {
                runOnUiThread(() -> showRatings(average, formatUserRatings(average, userRatings)));
            }


        });
    }
    /**
     * Is used to update the local user database with the user ratings per category
     * @param ratingResponses
     */
    private void updateLocalUserRatings(
            List<TopicAverageResponse> ratingResponses
    ) {
        SearchService searchService =
                Database.getInstance(requireContext()).searchService();

        executorService.execute(() -> {
            for (TopicAverageResponse response : ratingResponses) {
                searchService.upsertRating(new Rating(
                        lecture.id,
                        response.category(),
                        response.value(),
                        Rater.USER
                ));
            }
        });
    }

    private void setEmptyRating() {
        Call<RatingCategoriesResponse> responseCall = apiService.getCategories(lecture.id);
        responseCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<RatingCategoriesResponse> call, @NonNull Response<RatingCategoriesResponse> response) {
                RatingCategoriesResponse body = response.body();
                if (!response.isSuccessful() || body == null || body.categories() == null) {
                    Log.d(TAG, "couldn't get the ratings, status " + response.code());
                    return;
                }

                List<TopicAverageResponse> topicRatings = new ArrayList<>();
                List<RatingCategoryResponse> categories = body.categories();
                for (RatingCategoryResponse category : categories) {
                    topicRatings.add(new TopicAverageResponse(category.category(), 0));
                }
                showRatings(topicRatings, null);
            }

            @Override
            public void onFailure(@NonNull Call<RatingCategoriesResponse> call, @NonNull Throwable throwable) {
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

        if (ratings == null || ratings.isEmpty()) {
            return;
        }
        // Sorting the categories alphabetically, so they always come out in the same order
        ArrayList<TopicAverageResponse> ratingsSorted = new ArrayList<>(ratings);
        ratingsSorted.sort(Comparator.comparing(
                r -> r.category().getDisplayName(),
                String.CASE_INSENSITIVE_ORDER
        ));

        if (userRatings == null || userRatings.isEmpty()) {
            ratingAdapter = new RatingAdapter(ratingsSorted, (ArrayList<TopicAverageResponse>) userRatings);
            recyclerView.setAdapter(ratingAdapter);
        } else {
            ArrayList<TopicAverageResponse> userRatingsSorted = new ArrayList<>(userRatings);


            userRatingsSorted.sort(Comparator.comparing(
                    r -> r.category().getDisplayName(),
                    String.CASE_INSENSITIVE_ORDER
            ));

            ratingAdapter = new RatingAdapter(ratingsSorted, userRatingsSorted);
            recyclerView.setAdapter(ratingAdapter);
        }

        // Nothing was rated yet, so there is no average to show either. Without this the
        // division below would produce NaN.
        if (ratings.isEmpty()) {
            binding.averageLectureRating.setText("-");
            return;
        }

        Call<LectureDetailResponse> call = apiService.getLecture(lecture.id);
        executorService.execute(() -> call.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<LectureDetailResponse> call1, Response<LectureDetailResponse> response) {
                LectureDetailResponse body = response.body();
                if (!response.isSuccessful() || body == null || body.lecture() == null) {
                    return;
                }

                applyLectureAverageFromServer(body.lecture().averageRating());
            }

            @Override
            public void onFailure(Call<LectureDetailResponse> call1, Throwable throwable) {

            }
        }));
    }

    /**
     * Sends the updated ratings to the server
     */
    public void setSubmitRatingListener() {
        binding.submitRating.setOnClickListener(v -> {


            // Check if all categories have been rated by the user
            List<TopicAverageResponse> allRatings = ratingAdapter.getRatings();
            Map<RatingCategory, Double> changedRatings = ratingAdapter.getChangedRatings();
            boolean check = false;
            for (TopicAverageResponse rating : allRatings) {
                if (!changedRatings.containsKey(rating.category())) {
                    check = true;
                    break;
                }
            }
            if (check) {
                Toast.makeText(getContext(), "Please rate all categories before submitting.", Toast.LENGTH_SHORT).show();
                return;
            }



            List<RatingTopicRequest> requestList = new ArrayList<>();
            for (Map.Entry<RatingCategory, Double> entry : changedRatings.entrySet()) {
                requestList.add(new RatingTopicRequest(entry.getKey(), entry.getValue()));
            }

            // Creating the Request
            RatingRequest request = new RatingRequest(lecture.id, requestList);
            String token = LoginSession.from(requireContext()).bearerToken();

            // (Trying to) submit the ratings
            if (!AuthManager.getInstance().isLoggedIn()) {
                Toast.makeText(getContext(), "You are not logged in.", Toast.LENGTH_SHORT).show();
            } else {
                apiService.submitRating(token, request).enqueue(new Callback<>() {
                    @Override
                    public void onResponse(@NonNull Call<ServerResponse> call, @NonNull Response<ServerResponse> response) {
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
                        updateProfRating();
                        updateLectureRating();
                    }

                    @Override
                    public void onFailure(@NonNull Call<ServerResponse> call, @NonNull Throwable throwable) {
                        requireActivity().runOnUiThread(() -> Toast.makeText(requireContext(), "Your rating couldn't be sent.", Toast.LENGTH_SHORT).show());
                    }
                });
            }
        }
        );
    }

    /**
     * Updates the local average rating of a professor to reflect a submitted rating.
     */
    private void updateProfRating() {
        String profId = professor.id;

        apiService.getProfessor(profId).enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<ProfessorDetailResponse> call,
                                   @NonNull Response<ProfessorDetailResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ProfessorDetailResponse professorDetail = response.body();

                    ProfessorResponse professorResponse = professorDetail.professor();
                    float newAverage = (float) professorResponse.averageRating();

                    professor.averageRating = newAverage;


                    executorService.execute(() -> {
                        SearchService searchService =
                                Database.getInstance(requireContext()).searchService();

                        searchService.updateProfessorAverageRating(
                                profId,
                                newAverage
                        );
                    });
                }
            }

            @Override
            public void onFailure(@NonNull Call<ProfessorDetailResponse> call,@NonNull Throwable t) {
                t.printStackTrace();
            }
        });
    }

    private void updateLectureRating() {
        String lectureId = lecture.id;

        apiService.getLecture(lectureId).enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<LectureDetailResponse> call,
                                   @NonNull Response<LectureDetailResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LectureDetailResponse lectureDetail = response.body();
                    LectureResponse lectureResponse = lectureDetail.lecture();
                    applyLectureAverageFromServer(lectureResponse.averageRating());
                }
            }

            @Override
            public void onFailure(@NonNull Call<LectureDetailResponse> call, @NonNull Throwable throwable) {
                throwable.printStackTrace();
            }
        });

    }



    /**
     * Inserts the answers of a comment right below it.
     *
     * @param comment the selected comment
     */
    @Override
    public void onOpenReplies(Comment comment) {

        flowInterface.openReplyFragment(comment);
    }

    @Override
    public void vote(String commentID, VoteType voteType, CommentType commentType) {
        CommentHelper.vote(requireContext(), apiService, commentID, voteType, commentType);
    }

    @Override
    public void reportComment(String commentID) {
        CommentHelper.showCommentReportDialog(getLayoutInflater(), apiService, getContext(), commentID, CommentType.COMMENT);
    }

    @Override
    public void reportReply(String commentID) {
        //This is never used in this class
    }

    private void updateLocalRatingsFromRequest(List<RatingTopicRequest> ratingRequests) {
        SearchService searchService = Database.getInstance(getContext()).searchService();
        executorService.execute(() -> {
            for (RatingTopicRequest ratingResponse: ratingRequests){
                Rating rating = new Rating(lecture.id, ratingResponse.category(), ratingResponse.value(), Rater.USER);
                searchService.upsertRating(rating);
            }
        });
    }
    private void updateLocalRatingsFromResponse(List<TopicAverageResponse> ratingResponses) {
        executorService.execute(() -> {
            List<Rating> ratings = new ArrayList<>();
            for (TopicAverageResponse ratingResponse: ratingResponses){
                ratings.add(new Rating(
                        lecture.id,
                        ratingResponse.category(),
                        ratingResponse.value(),
                        Rater.AVERAGE
                ));
            }
            searchService.replaceLectureRatings(lecture.id, Rater.AVERAGE, ratings);
        });
    }

    /**
     * Applies a fresh overall lecture average to the screen, the in-memory model and Room.
     */
    private void applyLectureAverageFromServer(double averageRating) {
        lecture.averageRating = averageRating;
        runOnUiThread(() -> {
            binding.averageLectureRating.setText(
                    String.format(Locale.ROOT, RATING_FORMAT, averageRating)
            );
            binding.averageLectureRating.setTextColor(
                    RatingColorCalculator.calculateColour(
                            binding.averageLectureRating.getContext(),
                            averageRating
                    )
            );
        });

        executorService.execute(() -> searchService.updateLectureRating(
                lecture.id,
                averageRating
        ));
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
