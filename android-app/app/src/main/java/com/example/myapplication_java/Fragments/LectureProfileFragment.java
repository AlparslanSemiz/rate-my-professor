package com.example.myapplication_java.Fragments;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.room.Room;

import com.example.myapplication_java.Adapters.ControlFlowInterface;
import com.example.myapplication_java.Adapters.ProfileLectureAdapter;
import com.example.myapplication_java.Adapters.ProfileSemesterAdapter;
import com.example.myapplication_java.Adapters.SearchService;
import com.example.myapplication_java.DomainModel.Lecture;
import com.example.myapplication_java.DomainModel.Professor;
import com.example.myapplication_java.DomainModel.Semester;
import com.example.myapplication_java.ServerCommunication.Database;
import com.example.myapplication_java.databinding.FragmentProfileBinding;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LectureProfileFragment extends Fragment {

    FragmentProfileBinding binding;
    private Professor professor;
    private SearchService service;
    private String currentLectureTitle;
    private ExecutorService executor;

    private String lectureTitle;
    private ControlFlowInterface flowInterface;

    public LectureProfileFragment() {
        // Required empty public constructor
    }

    public LectureProfileFragment(Professor professor) {
        this.professor = professor;
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
        binding.averageRatingBackground.setText("5");
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
        executor.execute(() -> {
            List<String> lectures = service.getLectureTitlesByProfessor(professor.id);
            ProfileLectureAdapter adapter = new ProfileLectureAdapter(lectures, this::onLectureClicked);
            requireActivity().runOnUiThread(()-> {
                lectureList.setAdapter(adapter);
            });
            currentLectureTitle = lectures.get(0);
            Log.println(Log.DEBUG, "lesson", currentLectureTitle);
            onLectureClicked(currentLectureTitle);
        });
        binding.name.setText(professor.firstName);
        binding.surname.setText(professor.lastName);
        return binding.getRoot();

    }

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

    private void openLectureProfile(Semester semester) {
        executor.execute(() -> {
            List<Lecture> lectures = service.getLecture(professor.id, lectureTitle, semester.semesterYear, semester.semesterSeason);
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