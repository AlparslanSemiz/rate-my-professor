package com.example.myapplication_java;

import static org.junit.Assert.fail;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
@Ignore("Disabled until the professor profile, comment flow, search UI, and KIT login flow are fully wired.")
public class UserStoryInstrumentedTest {
    @Test
    public void kitStudentCanSeeAndRateCurrentProfessor() {
        fail("Pending: open professor details, show current professor data, submit rating, and verify updated rating state.");
    }

    @Test
    public void kitStudentCanSearchAndFilterProfessorsByNameLectureAndCriteria() {
        fail("Pending: drive search UI and verify filtering by professor name, lecture, and additional criteria.");
    }

    @Test
    public void kitStudentCanReadAndWriteProfessorComments() {
        fail("Pending: open professor comments, render existing comments, submit a new comment, and verify it appears.");
    }

    @Test
    public void kitStudentCanLoginWithKitMailVerification() {
        fail("Pending: enter KIT email, request login token, enter token, and verify navigation to the app.");
    }
}
