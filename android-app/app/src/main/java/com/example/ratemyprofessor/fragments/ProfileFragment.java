package com.example.ratemyprofessor.fragments;

import android.content.Context;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.ratemyprofessor.adapters.ControlFlowInterface;
import com.example.ratemyprofessor.adapters.ProfileLectureAdapter;
import com.example.ratemyprofessor.adapters.ProfileProfessorAdapter;
import com.example.ratemyprofessor.adapters.ProfileSemesterAdapter;
import com.example.ratemyprofessor.adapters.SearchService;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.SelectionType;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.servercommunication.APIService;
import com.example.ratemyprofessor.servercommunication.Database;
import com.example.ratemyprofessor.servercommunication.RetrofitClient;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorDetailResponse;
import com.example.ratemyprofessor.servercommunication.responses.ProfessorResponse;

import com.example.ratemyprofessor.databinding.FragmentProfileBinding;
import com.example.ratemyprofessor.logic.RatingColorCalculator;

import java.util.List;
import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * This fragment is the second step of lecture offering selection. Here a professor or
 * lecture is already selected. The fragment selects the other one of the lecture or professor
 * and a semester. Then it finds the offering with these 3 combinations and requests the info from
 * the server.
 *
 * <p>Both entry points end up in the same state: a professor plus a lecture title. The upper
 * list shows whichever of the two was not picked yet, and the lower list shows the semesters
 * in which that pair exists.</p>
 */
public class ProfileFragment extends Fragment {

    private static final String TAG = "ProfileFragment";

    /**
     * Format of the average shown on top of the screen, always with one decimal.
     */
    private static final String RATING_FORMAT = "%.1f";

    private FragmentProfileBinding binding;
    private SelectionType selectionType;
    private Professor professor;
    private SearchService service;
    private APIService apiService;
    private ExecutorService executor;
    private String lectureTitle;
    private ControlFlowInterface flowInterface;

    /**
     * Creates an empty fragment for Android lifecycle instantiation.
     */
    public ProfileFragment() {
        // Required empty public constructor
    }

    /**
     * Entry point coming from the professor list. The lecture is still open.
     *
     * @param currentProfessor the professor the user picked
     */
    public ProfileFragment(Professor currentProfessor) {
        this.professor = currentProfessor;
        selectionType = SelectionType.PROFESSORS;
    }

    /**
     * Entry point coming from the lecture list. The professor is still open.
     *
     * @param lectureTitle the name of the lecture the user picked
     */
    public ProfileFragment(String lectureTitle) {
        this.lectureTitle = lectureTitle;
        selectionType = SelectionType.LECTURES;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentProfileBinding.inflate(inflater, container, false);

        binding.lectureList.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        binding.semesterList.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.backButton.setOnClickListener(v -> requireActivity().getOnBackPressedDispatcher().onBackPressed());

        service = Database.getInstance(requireContext()).searchService();
        apiService = RetrofitClient.getClient().create(APIService.class);
        executor = Executors.newSingleThreadExecutor();

        // Displaying average rating in the header
        displayHeaderRating();

        bindHeader();
        loadUpperList();
        binding.backButton.setOnClickListener(v ->
                getParentFragmentManager().popBackStack()
        );

        setHeader();

        return binding.getRoot();

    }

    private void displayHeaderRating() {
        if (selectionType == SelectionType.PROFESSORS) {
            displayProfessorRatingFromCacheAndRefresh();
        } else {
            executor.execute(new Runnable() {
                @Override
                public void run() {
                    List<Lecture> lectures = service.getLecturesByTitle(lectureTitle);
                    double sum = 0;
                    for (Lecture lecture : lectures) {
                        sum += lecture.averageRating;
                    }
                    double averageRating = sum / lectures.size();
                    binding.averageRatingBackground.setText(String.format(Locale.ROOT, RATING_FORMAT,
                            averageRating));
                    binding.averageRatingBackground.setTextColor(RatingColorCalculator.calculateColour(requireContext(),
                            averageRating));
                }
            });
        }
    }

    /**
     * Shows the locally cached professor rating first and then replaces it with the latest
     * value from the server. A failed request deliberately leaves the cached value visible.
     */
    private void displayProfessorRatingFromCacheAndRefresh() {
        String professorId = professor.id;

        executor.execute(() -> {
            Professor cachedProfessor = service.getProfessorById(professorId);
            float cachedAverage = cachedProfessor != null
                    ? cachedProfessor.averageRating
                    : professor.averageRating;

            professor.averageRating = cachedAverage;
            runOnUiThread(() -> {
                showProfessorRating(cachedAverage);
                refreshProfessorRatingFromServer(professorId);
            });
        });
    }

    private void refreshProfessorRatingFromServer(String professorId) {
        apiService.getProfessor(professorId).enqueue(new Callback<>() {
            @Override
            public void onResponse(@NonNull Call<ProfessorDetailResponse> call,
                                   @NonNull Response<ProfessorDetailResponse> response) {
                ProfessorDetailResponse body = response.body();
                if (!response.isSuccessful() || body == null || !body.success()
                        || body.professor() == null) {
                    Log.d(TAG, "Could not refresh rating for professor " + professorId);
                    return;
                }

                ProfessorResponse serverProfessor = body.professor();
                float updatedAverage = (float) serverProfessor.averageRating();
                professor.averageRating = updatedAverage;
                runOnUiThread(() -> showProfessorRating(updatedAverage));

                if (!executor.isShutdown()) {
                    executor.execute(() -> service.updateProfessorAverageRating(
                            professorId,
                            updatedAverage
                    ));
                }
            }

            @Override
            public void onFailure(@NonNull Call<ProfessorDetailResponse> call,
                                  @NonNull Throwable throwable) {
                Log.d(TAG, "Could not refresh rating for professor " + professorId,
                        throwable);
            }
        });
    }

    private void showProfessorRating(double averageRating) {
        binding.averageRatingBackground.setText(String.format(
                Locale.ROOT,
                RATING_FORMAT,
                averageRating
        ));
        binding.averageRatingBackground.setTextColor(
                RatingColorCalculator.calculateColour(requireContext(), averageRating)
        );
    }

    /**
     * We need this because we use the same xml for prof and lecture
     * but lectures don't have a first name
     */
    private void setHeader() {
        if (selectionType == SelectionType.PROFESSORS) {
            binding.name.setVisibility(View.VISIBLE);
            binding.name.setText(professor.firstName);
            binding.surname.setText(professor.lastName);
        } else {
            binding.name.setVisibility(View.GONE);
            binding.surname.setText(lectureTitle);
        }
    }
    /**
     * Writes the already known part of the selection into the header.
     */
    private void bindHeader() {
        if (selectionType == SelectionType.PROFESSORS) {
            binding.name.setText(professor.firstName);
            binding.surname.setText(professor.lastName);
        } else {
            binding.name.setText("");
            binding.surname.setText(lectureTitle);
        }
    }

    /**
     * Get the lectures (if professor is selected, or vica versa) of the professor and then
     * display them on the upper list.
     *
     * <p>The first entry is preselected so the semester list below is not empty when the
     * screen opens.</p>
     */
    private void loadUpperList() {
        RecyclerView lectureList = binding.lectureList;

        executor.execute(() -> {
            if (selectionType == SelectionType.PROFESSORS) {
                List<String> lectures = service.getLectureTitlesByProfessor(professor.id);
                if (lectures.isEmpty()) {
                    return;
                }

                ProfileLectureAdapter adapter = new ProfileLectureAdapter(lectures, this::onLectureClicked);
                runOnUiThread(() -> lectureList.setAdapter(adapter));
                lectureTitle = lectures.get(0);
            } else {
                List<Professor> professors = service.getProfessorsByLectureTitle(lectureTitle);
                if (professors.isEmpty()) {
                    return;
                }

                ProfileProfessorAdapter adapter = new ProfileProfessorAdapter(professors, this::onProfessorClicked);
                runOnUiThread(() -> lectureList.setAdapter(adapter));
                professor = professors.get(0);
            }

            Log.d(TAG, "lesson " + lectureTitle);
            showSemesters();
        });
    }

    /**
     * gets the semesters the professor gives the lecture in and lists them.
     *
     * @param lectureTitle the lecture the user picked in the upper list
     */
    private void onLectureClicked(String lectureTitle) {
        this.lectureTitle = lectureTitle;
        showSemesters();
    }


    /**
     * gets the semesters the professor gives the lecture in and lists them.
     *
     * @param professor the professor the user picked in the upper list
     */
    private void onProfessorClicked(Professor professor) {
        this.professor = professor;
        showSemesters();
    }

    /**
     * Fills the lower list with every semester in which the currently selected professor held
     * the currently selected lecture.
     *
     * <p>Both lists lead here, since picking either one narrows down the same pair.</p>
     */
    private void showSemesters() {

        executor.execute(() -> {

            List<Semester> semesters = service.getSemestersByProfessorAndLectureTitle(
                            professor.id, lectureTitle);

            List<Lecture> lectures = new ArrayList<>();

            for (Semester semester : semesters) {

                List<Lecture> result = service.getLecture(professor.id, lectureTitle,
                        semester.semesterYear(), semester.semesterSeason());

                if (!result.isEmpty()) {
                    lectures.add(result.get(0));
                }
            }
            runOnUiThread(() -> {

                ProfileSemesterAdapter adapter = new ProfileSemesterAdapter(requireContext(),
                                semesters, lectures, this::openLectureProfile);
                binding.semesterList.setAdapter(adapter);
            });
        });
    }

    /**
     * sends the user to the final rating page.
     *
     * @param semester the semester the user picked, which completes the selection
     */
    private void openLectureProfile(Semester semester) {
        executor.execute(() -> {
            List<Lecture> lectures = service.getLecture(professor.id, lectureTitle, semester.semesterYear(), semester.semesterSeason());
            if (lectures.isEmpty()) {
                Log.d(TAG, "no offering for " + lectureTitle + " in " + semester);
                return;
            }

            Lecture selectedLecture = lectures.get(0);
            runOnUiThread(() -> flowInterface.openLectureProfile(professor, semester, selectedLecture));
        });
    }

    /**
     * Runs the given action on the UI thread, but only while the fragment is still attached.
     *
     * <p>Database queries run in the background and can finish after the user already left,
     * at which point touching the views would crash.</p>
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
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        if (context instanceof ControlFlowInterface) {
            flowInterface = (ControlFlowInterface) context;
        } else {
            throw new RuntimeException(context + "must implement ControlFlowInterface");
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Null when the fragment was destroyed before its view was ever created.
        if (executor != null) {
            executor.shutdown();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        showSemesters();
    }
}
