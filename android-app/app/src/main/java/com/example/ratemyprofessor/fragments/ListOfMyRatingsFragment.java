package com.example.ratemyprofessor.fragments;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.ratemyprofessor.adapters.ControlFlowInterface;
import com.example.ratemyprofessor.adapters.ListOfMyRatingsAdapter;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.servercommunication.LoginSession;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingDto;
import com.example.ratemyprofessor.servercommunication.responses.UserRatingResponse;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.databinding.FragmentListOfMyRatingsBinding;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Displays the ratings submitted by the current user and opens the selected lecture profile.
 */
public class ListOfMyRatingsFragment extends Fragment {

    private FragmentListOfMyRatingsBinding binding;

    private final APIService apiService;

    private SearchService searchService;

    private ControlFlowInterface flowInterface;

    private ExecutorService executor;

    private static final String TAG = "ListOfMyRatings";

    /**
     * Creates an empty fragment for Android lifecycle instantiation.
     */
    public ListOfMyRatingsFragment() {
        apiService = RetrofitClient.getClient().create(APIService.class);
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

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentListOfMyRatingsBinding.inflate(inflater, container, false);
        binding.backButton.setOnClickListener(v ->
                requireActivity().getSupportFragmentManager().popBackStack()
        );

        setUpList();

        searchService = Database.getInstance(requireContext()).searchService();
        executor = Executors.newSingleThreadExecutor();

        return binding.getRoot();
    }

    /**
     * Sets up the adapter for showing all ratings given by the user.
     */
    public void setUpList() {
        LoginSession session = LoginSession.from(requireContext());
        Call<UserRatingResponse> getRatingsCall = apiService.getUserRatings(session.bearerToken());

        getRatingsCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<UserRatingResponse> getRatingsCall, @NonNull Response<UserRatingResponse> response) {
                UserRatingResponse body = response.body();
                assert body != null;
                List<UserRatingDto> ratings = body.ratings();
                runOnUiThread(() -> showRatings(ratings));
            }

            @Override
            public void onFailure(@NonNull Call<UserRatingResponse> getRatingsCall,@NonNull Throwable t) {
                Log.e(TAG, "Error: " + t.getMessage());
            }
        });
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
     * Displays the supplied user ratings in the list and registers the selection callback.
     *
     * @param ratings the ratings to display
     */
    public void showRatings(List<UserRatingDto> ratings) {
        RecyclerView recyclerView = binding.listOfMyRatingsList;
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        RecyclerView.Adapter<ListOfMyRatingsAdapter.UserRatingViewHolder> adapter = new ListOfMyRatingsAdapter(ratings, this::openRating);
        recyclerView.setAdapter(adapter);
    }

    /**
     * Passes the user to the lecture offering tab when the corresponding rating is clicked.
     *
     * @param semester the selected semester
     * @param profId the identifier of the professor
     * @param lectureName the name of the lecture
     */
    public void openRating(Semester semester, String profId, String lectureName) {
        executor.execute(() -> {
            List<Lecture> lectures = searchService.getLecture(profId, lectureName,
                    semester.semesterYear(), semester.semesterSeason());
            if (lectures.isEmpty()) {
                Log.d(TAG, "no offering for " + lectureName + " in " + semester);
                return;
            }
            Professor prof = searchService.getProfessorById(profId);
            Lecture lecture = lectures.get(0);

            runOnUiThread(() -> flowInterface.openLectureProfile(prof, semester, lecture));
        });
    }
}
