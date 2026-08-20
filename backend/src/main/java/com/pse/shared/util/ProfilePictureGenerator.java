package com.pse.shared.util;

import com.pse.user.model.Student;

import java.util.UUID;

public final class ProfilePictureGenerator {

    private static final String DICEBEAR_BASE_URL =
            "https://api.dicebear.com/10.x/thumbs/svg"
                    + "?eyesProbability=100"
                    + "&eyesVariant=variant02,variant03,variant04,variant05,variant06,variant07,variant08"
                    + "&seed=";

    private ProfilePictureGenerator() {
        // Utility class
    }


    public static String generateProfilePicture(Student student) {
        return generateProfilePicture(student.getId());
    }


    public static String generateProfilePicture(UUID studentId) {
        return DICEBEAR_BASE_URL + studentId;
    }
}