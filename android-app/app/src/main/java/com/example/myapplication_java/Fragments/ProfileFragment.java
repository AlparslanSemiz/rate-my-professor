package com.example.myapplication_java.Fragments;

import android.content.Context;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.room.Room;

import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.Adapters.ProfileLectureAdapter;
import com.example.myapplication_java.Adapters.ProfileProfessorAdapter;
import com.example.myapplication_java.Adapters.ProfileSemesterAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.SelectionType;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.ServerCommunication.Database;

import com.example.myapplication_java.databinding.FragmentProfileBinding;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * This fragment is the second step of lecture offering selection. Here a professor or
 * lecture is already selected. The fragment selects the other one of the lecture or professor
 * and a semester. Then it finds the offering with these 3 combinations and requests the info from
 * the server.
 */
public class ProfileFragment extends Fragment {
    private FragmentProfileBinding binding;
    private SelectionType selectionType;
    private Professor professor;
    private SearchService service;
    private ExecutorService executor;
    private String lectureTitle;
    private ControlFlowInterface flowInterface;

    public ProfileFragment() {
        // Required empty public constructor
    }

    public ProfileFragment(Professor currentProfessor) {
        this.professor = currentProfessor;
        selectionType = SelectionType.PROFESSORS;
    }

    public ProfileFragment(String lectureTitle) {
        this.lectureTitle = lectureTitle;
        selectionType = SelectionType.LECTURES;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        binding.averageRatingBackground.setText("5.0");
        binding.lectureList.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        binding.semesterList.setLayoutManager(new LinearLayoutManager(requireContext()));

        Database database = Room.databaseBuilder(
                getContext(),
                Database.class,
                Database.DB_NAME
        ).fallbackToDestructiveMigration(true).build();

        service = database.searchService();

        RecyclerView lectureList = binding.lectureList;
        executor = Executors.newSingleThreadExecutor();
        // Get the lectures (if professor is selected, or vica versa) of the professor and then
        // display them on the upper list.
        executor.execute(() -> {
            if (selectionType == SelectionType.PROFESSORS) {
                List<String> lectures = service.getLectureTitlesByProfessor(professor.id);
                ProfileLectureAdapter adapter = new ProfileLectureAdapter(lectures, this::onLectureClicked);
                requireActivity().runOnUiThread(()-> {
                    lectureList.setAdapter(adapter);
                });
                lectureTitle = lectures.get(0);
            } else {
                List<Professor> professors = service.getProfessorsByLectureTitle(lectureTitle);
                ProfileProfessorAdapter adapter = new ProfileProfessorAdapter(professors, this::onProfessorClicked);
                requireActivity().runOnUiThread(()-> {
                    lectureList.setAdapter(adapter);
                });
                professor = professors.get(0);
            }
            Log.println(Log.DEBUG, "lesson", lectureTitle);
            onLectureClicked(lectureTitle);
        });
        if (selectionType == SelectionType.PROFESSORS) {
            binding.name.setText(professor.firstName);
            binding.surname.setText(professor.lastName);
        } else {
            binding.name.setText("");
            binding.surname.setText(lectureTitle);
        }
        return binding.getRoot();

    }

    /**
     * gets the semesters the professor gives the lecture in and lists them.
     */
    private void onLectureClicked(String lectureTitle) {
        RecyclerView semesterList = binding.semesterList;
        executor.execute(() -> {
            this.lectureTitle = lectureTitle;
            List<Semester> semesters = service.getSemestersByProfessorAndLectureTitle(professor.id, lectureTitle);
            Log.println(Log.DEBUG, "semesters", semesters.toString());
            ProfileSemesterAdapter adapter = new ProfileSemesterAdapter(semesters, this::openLectureProfile);
            requireActivity().runOnUiThread(()-> {
                semesterList.setAdapter(adapter);
            });
        });
    }


    /**
     * gets the semesters the professor gives the lecture in and lists them.
     */
    private void onProfessorClicked(Professor professor) {
        RecyclerView semesterList = binding.semesterList;
        executor.execute(() -> {
            this.professor = professor;
            List<Semester> semesters = service.getSemestersByProfessorAndLectureTitle(professor.id, lectureTitle);
            Log.println(Log.DEBUG, "semesters", semesters.toString());
            ProfileSemesterAdapter adapter = new ProfileSemesterAdapter(semesters, this::openLectureProfile);
            requireActivity().runOnUiThread(()-> {
                semesterList.setAdapter(adapter);
            });
        });
    }

    /**
     * sends the user to the final rating page.
     */
    private void openLectureProfile(Semester semester) {
        executor.execute(() -> {
            List<Lecture> lectures = service.getLecture(professor.id, lectureTitle, semester.semesterYear(), semester.semesterSeason());
            Lecture selectedLecture = lectures.get(0);
            flowInterface.openLectureProfile(professor, semester, selectedLecture);
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
}