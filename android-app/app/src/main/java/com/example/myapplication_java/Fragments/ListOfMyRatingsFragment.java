package com.example.myapplication_java.Fragments;

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

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.Adapters.ListOfMyRatingsAdapter;
import com.example.myapplication_java.Adapters.RatingAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.ServerCommunication.APIService;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.ServerCommunication.LoginSession;
import com.example.myapplication_java.ServerCommunication.Responses.StudentProfileResponse;
import com.example.myapplication_java.ServerCommunication.Responses.UserRatingDto;
import com.example.myapplication_java.ServerCommunication.Responses.UserRatingResponse;
import com.example.myapplication_java.ServerCommunication.RetrofitClient;
import com.example.myapplication_java.databinding.FragmentListOfMyRatingsBinding;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ListOfMyRatingsFragment extends Fragment {

    private FragmentListOfMyRatingsBinding binding;

    private final APIService apiService;

    private SearchService searchService;

    private ControlFlowInterface flowInterface;

    private ExecutorService executor;

    private ListOfMyRatingsAdapter adapter;

    private static final String TAG = "ListOfMyRatings";

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

    public void setUpList() {
        LoginSession session = LoginSession.from(requireContext());
        Call<UserRatingResponse> getRatingsCall = apiService.getUserRatings(session.bearerToken());

        getRatingsCall.enqueue(new Callback<>() {
            @Override
            public void onResponse(Call<UserRatingResponse> getRatingsCall, Response<UserRatingResponse> response) {
                UserRatingResponse body = response.body();
                List<UserRatingDto> ratings = body.ratings();
                runOnUiThread(() -> showRatings(ratings));
            }

            @Override
            public void onFailure(Call<UserRatingResponse> getRatingsCall, Throwable t) {
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

    public void showRatings(List<UserRatingDto> ratings) {
        RecyclerView recyclerView = binding.listOfMyRatingsList;
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new ListOfMyRatingsAdapter(ratings, this::openRating);
        recyclerView.setAdapter(adapter);
    }

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

            System.out.println(semester.semesterYear());
            System.out.println(prof.lastName);
            System.out.println(lecture.name);

            runOnUiThread(() -> flowInterface.openLectureProfile(prof, semester, lecture));
        });
    }
}
