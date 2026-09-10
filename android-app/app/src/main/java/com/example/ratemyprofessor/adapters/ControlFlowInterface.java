package com.example.ratemyprofessor.adapters;

import com.example.ratemyprofessor.domain.Comment;
import com.example.ratemyprofessor.domain.Lecture;
import com.example.ratemyprofessor.domain.Professor;
import com.example.ratemyprofessor.domain.Semester;
import com.example.ratemyprofessor.domain.VoteType;

/**
 * This interface is for managing the control flow of professor-lecture selection.
 * Through this interface the main activity is notified as to how it should navigate
 * and set the appropriate fragments.
 *
 * <p>Fragments deliberately do not replace each other: they only report what the user picked
 * and the hosting activity decides which screen comes next. That keeps the fragments
 * independent of the order they appear in.</p>
 *
 * <p>The selection runs over three steps. Starting from a professor or from a lecture, the
 * missing one plus a semester are chosen, which together identify one lecture offering.</p>
 */
public interface ControlFlowInterface {

    /**
     * Called when a screen wants to hand the user back to the home screen, for example when
     * the settings screen is closed.
     */
    void openHome();

    /**
     * Called when the user picked a professor in the search screen.
     *
     * @param professor the selected professor
     */
    void onProfessorSelected(Professor professor);

    /**
     * Called when the user picked a lecture in the search screen. Lectures are identified by
     * their title here, because the concrete offering is only known once a professor and a
     * semester were chosen as well.
     *
     * @param lectureTitle the name of the selected lecture
     */
    void onLectureSelected(String lectureTitle);

    /**
     * Called when professor, semester and lecture are all known, which identifies exactly one
     * lecture offering, and its rating screen can be opened.
     *
     * @param professor the professor holding the offering
     * @param semester  the semester it is held in
     * @param lecture   the selected lecture offering
     */
    void openLectureProfile(Professor professor, Semester semester, Lecture lecture);

    /**
     * Opens the replies to the selected comment with its current vote state.
     *
     * @param comment the selected comment
     * @param voteType the vote associated with the comment
     */
    void openReplyFragment(Comment comment);
}
